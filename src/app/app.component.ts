import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { AlertComponent } from './components/alert.component';
import { AccountService } from './_services/account.service';
import { Role } from './_models/role';
import { filter } from 'rxjs/operators';

@Component({
    selector: 'app',
    templateUrl: 'app.component.html',
    standalone: true,
    imports: [CommonModule, RouterModule, HttpClientModule, AlertComponent]
})
export class AppComponent implements OnInit {
    account: any;
    Role = Role;
    maintenanceMode = false;

    constructor(
        private accountService: AccountService,
        private router: Router
    ) {
        this.accountService.account.subscribe(x => {
            console.log('Account updated:', x);
            this.account = x;
            if (x) {
                if (this.router.url.includes('/account/login')) {
                    this.router.navigate(['home']);
                }
            }
        });
        
        // Subscribe to maintenance mode updates
        this.accountService.maintenanceMode.subscribe(isInMaintenance => {
            this.maintenanceMode = isInMaintenance;
            if (isInMaintenance && !this.router.url.includes('/maintenance')) {
                this.router.navigate(['/maintenance']);
            }
        });
    }

    ngOnInit() {
        this.accountService.checkApiStatus().subscribe();
        
        this.router.events.pipe(
            filter(event => event instanceof NavigationEnd)
        ).subscribe((event: NavigationEnd) => {
            console.log('Navigation completed:', event.url);
            
            if (this.maintenanceMode && !event.url.includes('/maintenance')) {
                this.router.navigate(['/maintenance']);
            }
        });
    }

    logout() {
        this.accountService.logout();
    }
}