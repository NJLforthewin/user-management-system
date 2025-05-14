import { Component, OnInit } from '@angular/core';
<<<<<<< HEAD
import { Router, ActivatedRoute } from '@angular/router';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';

import { AccountService, AlertService } from '@app/_services';

@Component({ templateUrl: 'login.component.html' })
export class LoginComponent implements OnInit {
    form: UntypedFormGroup;
=======
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { first } from 'rxjs/operators';
import { AlertService } from '../_services';
import { AccountService } from '../_services/account.service';

@Component({
    templateUrl: 'login.component.html',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule]
})
export class LoginComponent implements OnInit {
    form!: FormGroup;
>>>>>>> 650f93b9451382bfbc24bef93c62680c8442fe72
    loading = false;
    submitted = false;

    constructor(
<<<<<<< HEAD
        private formBuilder: UntypedFormBuilder,
=======
        private formBuilder: FormBuilder,
>>>>>>> 650f93b9451382bfbc24bef93c62680c8442fe72
        private route: ActivatedRoute,
        private router: Router,
        private accountService: AccountService,
        private alertService: AlertService
<<<<<<< HEAD
    ) { }
=======
    ) {}
>>>>>>> 650f93b9451382bfbc24bef93c62680c8442fe72

    ngOnInit() {
        this.form = this.formBuilder.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', Validators.required]
        });
    }

<<<<<<< HEAD
    // convenience getter for easy access to form fields
    get f() { return this.form.controls; }

    onSubmit() {
        this.submitted = true;

        // reset alerts on submit
        this.alertService.clear();

        // stop here if form is invalid
        if (this.form.invalid()) {
=======
    get f() {
        return this.form.controls;
    }

    onSubmit() {
        this.submitted = true;
        this.alertService.clear();

        if (this.form.invalid) {
>>>>>>> 650f93b9451382bfbc24bef93c62680c8442fe72
            return;
        }

        this.loading = true;
        this.accountService.login(this.f.email.value, this.f.password.value)
            .pipe(first())
            .subscribe({
                next: () => {
<<<<<<< HEAD
                    // get return url from query parameters or default to home page
=======
>>>>>>> 650f93b9451382bfbc24bef93c62680c8442fe72
                    const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
                    this.router.navigateByUrl(returnUrl);
                },
                error: error => {
                    this.alertService.error(error);
                    this.loading = false;
                }
            });
    }
}