// src/app/_helpers/error.interceptor.ts
import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

import { AccountService } from '../_services/account.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
    constructor(
        private accountService: AccountService,
        private router: Router  // Make sure Router is injected
    ) {}

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return next.handle(request).pipe(catchError(err => {
            console.error('Error intercepted:', err);
            if ([401, 403].includes(err.status) && this.accountService.accountValue) {
                this.accountService.logout();
            }
            
            if (err.status === 503) {
                console.log('Maintenance mode detected, navigating to maintenance page');
                
                if (err.error && err.error.status === 'maintenance') {
                    this.router.navigate(['/maintenance']);
                    
                    return throwError(() => 'System is under maintenance');
                }
            }

            const error = err.error?.message || err.statusText;
            console.error('Error details:', error);
            return throwError(() => error);
        }));
    }
}