import { Component } from '@angular/core';
<<<<<<< HEAD
import { Router } from '@angular/router';

import { AccountService } from '@app/_services';

@Component({ templateUrl: 'layout.component.html' })
export class LayoutComponent {
    constructor(
        private router: Router,
        private accountService: AccountService
    ) {
        // redirect to home if already logged in
        if (this.accountService.accountValue) {
            this.router.navigate(['/']);
        }
    }
}
=======
import { RouterModule } from '@angular/router';

@Component({
    templateUrl: 'layout.component.html',
    standalone: true,
    imports: [RouterModule]
})
export class LayoutComponent {}
>>>>>>> 650f93b9451382bfbc24bef93c62680c8442fe72
