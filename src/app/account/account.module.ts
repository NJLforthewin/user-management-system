import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
<<<<<<< HEAD
=======
import { RouterModule } from '@angular/router';
>>>>>>> 650f93b9451382bfbc24bef93c62680c8442fe72

import { AccountRoutingModule } from './account-routing.module';
import { LayoutComponent } from './layout.component';
import { LoginComponent } from './login.component';
import { RegisterComponent } from './register.component';
import { VerifyEmailComponent } from './verify-email.component';
<<<<<<< HEAD
import { ForgotPasswordComponent } from './forgot-password.component';
import { ResetPasswordComponent } from './reset-password.component';
=======
import { ResetPasswordComponent } from './reset-password.component';
import { ForgotPasswordComponent } from './forgot-password.component';
>>>>>>> 650f93b9451382bfbc24bef93c62680c8442fe72

@NgModule({
    imports: [
        CommonModule,
        ReactiveFormsModule,
<<<<<<< HEAD
        AccountRoutingModule
    ],
    declarations: [
=======
        RouterModule,
        AccountRoutingModule,
>>>>>>> 650f93b9451382bfbc24bef93c62680c8442fe72
        LayoutComponent,
        LoginComponent,
        RegisterComponent,
        VerifyEmailComponent,
<<<<<<< HEAD
        ForgotPasswordComponent,
        ResetPasswordComponent
    ]
})
export class AccountModule { }
=======
        ResetPasswordComponent,
        ForgotPasswordComponent
    ],
    declarations: [
    ]
})
export class AccountModule {}
>>>>>>> 650f93b9451382bfbc24bef93c62680c8442fe72
