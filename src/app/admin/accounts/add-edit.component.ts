import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { UntypedFormBuilder, UntypedFormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { first } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { AccountService, AlertService } from '@app/_services';
import { MustMatch } from '@app/_helpers';

@Component({
    standalone: true,
    imports: [CommonModule, RouterModule, ReactiveFormsModule],
    templateUrl: 'add-edit.component.html'
})
export class AddEditComponent implements OnInit {
    form!: UntypedFormGroup;
    id?: string;
    isAddMode!: boolean;
    loading = false;
    submitted = false;
    account: any = null; 
    
    constructor(
        private formBuilder: UntypedFormBuilder,
        private route: ActivatedRoute,
        private router: Router,
        private accountService: AccountService,
        private alertService: AlertService
    ) {}
    
    ngOnInit() {
        this.id = this.route.snapshot.params['id'];
        this.isAddMode = !this.id;
        
        this.form = this.formBuilder.group({
            title: ['', Validators.required],
            firstName: ['', Validators.required],
            lastName: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            role: ['', Validators.required],
            password: ['', [Validators.minLength(6), this.isAddMode ? Validators.required : Validators.nullValidator]],
            confirmPassword: ['', this.isAddMode ? Validators.required : Validators.nullValidator]
        }, {
            validator: MustMatch('password', 'confirmPassword')
        });
        
        
        if (!this.isAddMode) {
            this.accountService.getById(this.id!)
                .pipe(first())
                .subscribe(x => {
                    this.account = x;
                    this.form.patchValue(x);
                });
        }
    }
    
    get f() { return this.form.controls; }
    
    toggleActivation(account: any) {
        if (confirm(`Are you sure you want to ${account.isActive ? 'deactivate' : 'activate'} this account?`)) {
            this.loading = true;
            const updatedData = { isActive: !account.isActive };
            this.accountService.update(this.id!, updatedData)
                .pipe(first())
                .subscribe({
                    next: () => {
                        this.account.isActive = !this.account.isActive;
                        this.alertService.success(`Account ${this.account.isActive ? 'activated' : 'deactivated'} successfully`);
                        this.loading = false;
                    },
                    error: error => {
                        this.alertService.error(error);
                        this.loading = false;
                    }
                });
        }
    }
    
    deleteAccount() {
        if (confirm('Are you sure you want to delete this account? This action cannot be undone.')) {
            this.loading = true;
            this.accountService.delete(this.id!)
                .pipe(first())
                .subscribe({
                    next: () => {
                        this.alertService.success('Account deleted successfully', { keepAfterRouteChange: true });
                        this.router.navigate(['../../'], { relativeTo: this.route });
                    },
                    error: error => {
                        this.alertService.error(error);
                        this.loading = false;
                    }
                });
        }
    }
    
    onSubmit() {
        this.submitted = true;
        
        this.alertService.clear();
        
        if (this.form.invalid) {
            return;
        }  
        this.loading = true;
        if (this.isAddMode) {
            this.createAccount();
        } else {
            this.updateAccount();
        }
    }
    
    private createAccount() {
        this.accountService.create(this.form.value)
            .pipe(first())
            .subscribe({
                next: () => {
                    this.alertService.success('Account created successfully', { keepAfterRouteChange: true });
                    this.router.navigate(['../'], { relativeTo: this.route });
                },
                error: error => {
                    this.alertService.error(error);
                    this.loading = false;
                }
            });
    }
    
    private updateAccount() {
        this.accountService.update(this.id!, this.form.value)
            .pipe(first())
            .subscribe({
                next: () => {
                    this.alertService.success('Update successful', { keepAfterRouteChange: true });
                    this.router.navigate(['../../'], { relativeTo: this.route });
                },
                error: error => {
                    this.alertService.error(error);
                    this.loading = false;
                }
            });
    }
}
