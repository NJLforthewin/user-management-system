import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, finalize, tap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Account } from '../_models/account';

@Injectable({ providedIn: 'root' })
export class AccountService {
    private accountSubject: BehaviorSubject<Account | null>;
    public account: Observable<Account | null>;
    private maintenanceModeSubject = new BehaviorSubject<boolean>(false);
    public maintenanceMode = this.maintenanceModeSubject.asObservable();

    constructor(
        private http: HttpClient,
        private router: Router
    ) {
        this.accountSubject = new BehaviorSubject<Account | null>(null);
        this.account = this.accountSubject.asObservable();
        
        const storedAccount = localStorage.getItem('account');
        if (storedAccount) {
            const account = JSON.parse(storedAccount);
            this.accountSubject.next(account);
            this.startRefreshTokenTimer();
        }
    }

    public get accountValue(): Account | null {
        return this.accountSubject.value;
    }
        public get isInMaintenanceMode(): boolean {
        return this.maintenanceModeSubject.value;
    }

    checkApiStatus() {
        return this.http.get<any>(`${environment.apiUrl}/api/status`)
            .pipe(
                tap(response => {
                    const isMaintenanceMode = response.status === 'maintenance';
                    this.maintenanceModeSubject.next(isMaintenanceMode);
                    
                    if (isMaintenanceMode) {
                        this.router.navigate(['/maintenance']);
                    }
                    
                    return response;
                }),
                catchError(error => {
                    console.error('API Status check failed', error);
                    this.maintenanceModeSubject.next(true);
                    this.router.navigate(['/maintenance']);
                    return of({ status: 'maintenance' });
                })
            );
    }

    login(email: string, password: string) {
        return this.http.post<Account>(`${environment.apiUrl}/accounts/authenticate`, { email, password })
            .pipe(map(account => {
                localStorage.setItem('account', JSON.stringify(account));
                this.accountSubject.next(account);
                this.startRefreshTokenTimer();
                return account;
            }));
    }

    logout() {
        this.stopRefreshTokenTimer();
        
        localStorage.removeItem('account');
        this.accountSubject.next(null);
        
        this.router.navigate(['/account/login']);
    }
    
    register(account: Account) {
        return this.http.post(`${environment.apiUrl}/accounts/register`, account);
    }

    refreshToken() {
        return this.http.post<Account>(`${environment.apiUrl}/accounts/refresh-token`, {}, { withCredentials: true })
            .pipe(map(account => {
                this.accountSubject.next(account);
                localStorage.setItem('account', JSON.stringify(account));
                this.startRefreshTokenTimer();
                return account;
            }));
    }

    getAll(): Observable<Account[]> {
        return this.http.get<Account[]>(`${environment.apiUrl}/accounts`);
    }

    getById(id: string | number): Observable<Account> {
        return this.http.get<Account>(`${environment.apiUrl}/accounts/${id}`);
    }

    create(params: any) {
        return this.http.post<Account>(`${environment.apiUrl}/accounts`, params);
    }

    forgotPassword(email: string) {
        return this.http.post(`${environment.apiUrl}/accounts/forgot-password`, { email });
    }

    resetPassword(token: string, password: string, confirmPassword: string) {
        return this.http.post(`${environment.apiUrl}/accounts/reset-password`, { token, password, confirmPassword });
    }

    verifyEmail(token: string) {
        return this.http.post(`${environment.apiUrl}/accounts/verify-email`, { token });
    }
    
    deactivateAccount(id: string | number) {
        return this.http.delete<void>(`${environment.apiUrl}/accounts/${id}`)
            .pipe(finalize(() => {
                if (id === this.accountValue?.id) {
                    this.logout();
                }
            }));
    }
    
    update(id: string | number, params: any) {
        return this.http.put<Account>(`${environment.apiUrl}/accounts/${id}`, params)
            .pipe(map((account: Account) => {
                if (account.id === this.accountValue?.id) {
                    const updatedAccount = { ...this.accountValue, ...account };
                    this.accountSubject.next(updatedAccount);
                    localStorage.setItem('account', JSON.stringify(updatedAccount));
                }
                return account;
            }));
    }

    delete(id: string | number) {
        return this.http.delete<void>(`${environment.apiUrl}/accounts/${id}`)
            .pipe(finalize(() => {
                if (id === this.accountValue?.id) {
                    this.logout();
                }
            }));
    }

    private refreshTokenTimeout?: any;

    private startRefreshTokenTimer() {
        if (!this.accountValue?.jwtToken) return;
        
        try {
            const jwtToken = JSON.parse(atob(this.accountValue.jwtToken.split('.')[1]));
            const expires = new Date(jwtToken.exp * 1000);
            const timeout = expires.getTime() - Date.now() - (60 * 1000);
            this.refreshTokenTimeout = setTimeout(() => this.refreshToken().subscribe(), timeout);
        } catch (error) {
            console.error('Error starting refresh token timer:', error);
        }
    }

    private stopRefreshTokenTimer() {
        if (this.refreshTokenTimeout) {
            clearTimeout(this.refreshTokenTimeout);
        }
    }
}