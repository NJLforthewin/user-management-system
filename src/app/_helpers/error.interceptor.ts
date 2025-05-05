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
        private router: Router  // Add Router injection
    ) {}

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return next.handle(request).pipe(catchError(err => {
            // Handle 401/403 as before
            if ([401, 403].includes(err.status) && this.accountService.accountValue) {
                this.accountService.logout();
            }

            // Add handling for maintenance mode (503)
            if (err.status === 503 && err.error?.status === 'maintenance') {
                console.log('Maintenance mode detected, redirecting to maintenance page');
                this.router.navigate(['/maintenance']);
            }

            // Keep your existing error handling
            const error = err.error?.message || err.statusText;
            console.error(err);
            return throwError(() => error);
        }))
    }
}