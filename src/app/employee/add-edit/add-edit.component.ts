import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, AbstractControl, Validators, ValidatorFn } from '@angular/forms';
import { first } from 'rxjs/operators';

import { EmployeeService, DepartmentService, AlertService, AccountService } from '@app/_services';
import { Department, Account } from '@app/_models';

@Component({ 
    standalone: true,
    imports: [CommonModule, RouterModule, ReactiveFormsModule],
    templateUrl: 'add-edit.component.html' 
})
export class AddEditComponent implements OnInit {
    form!: FormGroup;
    id!: number;
    isAddMode!: boolean;
    loading = false;
    submitted = false;
    departments: Department[] = [];
    accounts: Account[] = []; 

    constructor(
        private formBuilder: FormBuilder,
        private route: ActivatedRoute,
        private router: Router,
        private employeeService: EmployeeService,
        private departmentService: DepartmentService,
        private accountService: AccountService, 
        private alertService: AlertService
    ) {}

    ngOnInit() {
        this.id = this.route.snapshot.params['id'];
        this.isAddMode = !this.id;
        
        this.loadDepartments();
        this.loadAccounts();
        
        this.form = this.formBuilder.group({
            employeeId: ['', [Validators.required, Validators.maxLength(20)]],
            accountId: ['', this.isAddMode ? Validators.required : Validators.nullValidator],
            position: ['', [Validators.required, Validators.maxLength(100)]],
            departmentId: ['', Validators.required],   
            hireDate: ['', Validators.required],
            status: ['Active', Validators.required]
        }); 
        
        if (!this.isAddMode) {
            this.loading = true;
            this.employeeService.getById(this.id)
                .pipe(first())
                .subscribe(
                    employee => {
                        const hireDate = employee.hireDate 
                            ? new Date(employee.hireDate).toISOString().split('T')[0]
                            : '';
                        
                        this.form.patchValue({
                            employeeId: employee.employeeId,
                            accountId: employee.account?.id || '',
                            position: employee.position,
                            departmentId: employee.departmentId,
                            hireDate: hireDate,
                            status: employee.status
                        });
                        this.loading = false;
                    },
                    error => {
                        this.alertService.error('Error loading employee: ' + error);
                        this.loading = false;
                        this.router.navigate(['../'], { relativeTo: this.route });
                    }
                );
        }
    }

    private loadDepartments() {
        this.departmentService.getAll()
            .pipe(first())
            .subscribe(
                departments => this.departments = departments,
                error => this.alertService.error('Error loading departments: ' + error)
            );
    }
    
    private loadAccounts() {
        this.accountService.getAll()
            .pipe(first())
            .subscribe(
                accounts => {
                    console.log('All accounts:', accounts);
                    
                    // Process accounts for display
                    if (this.isAddMode) {
                        // Only show active accounts for new employees
                        this.accounts = accounts.filter(account => {
                            // Check both isVerified and isActive if available
                            const isAccountActive = account.isVerified && 
                                                  (account.isActive === undefined || account.isActive === true);
                            
                            console.log(`Account ${account.email}: isVerified=${account.isVerified}, isActive=${account.isActive}, isAccountActive=${isAccountActive}`);
                            
                            return isAccountActive;
                        });
                    } else {
                        // Show all accounts for editing
                        this.accounts = accounts;
                    }
                    
                    // Sort accounts (active first, then by role, then by name)
                    this.accounts = this.accounts.sort((a, b) => {
                        const aActive = a.isVerified && (a.isActive === undefined || a.isActive === true);
                        const bActive = b.isVerified && (b.isActive === undefined || b.isActive === true);
                        
                        if (aActive && !bActive) return -1;
                        if (!aActive && bActive) return 1;
                        
                        if (a.role === 'Admin' && b.role !== 'Admin') return -1;
                        if (a.role !== 'Admin' && b.role === 'Admin') return 1;
                        
                        return (a.firstName + ' ' + a.lastName).localeCompare(b.firstName + ' ' + b.lastName);
                    });
                    
                    console.log('Filtered accounts for display:', this.accounts);
                },
                error => this.alertService.error('Error loading accounts: ' + error)
            );
    }
    
    // Helper to determine if an account is active
    isAccountActive(account: Account): boolean {
        return !!(account.isVerified && (account.isActive === undefined || account.isActive === true));
    }
    
    get f() { return this.form.controls; }

    onSubmit() {
        this.submitted = true;
        this.alertService.clear();

        if (this.form.invalid) {
            return;
        }

        const formData: any = { ...this.form.value };
        
        // Validate selected account is active
        if (this.isAddMode) {
            const selectedAccount = this.accounts.find(a => a.id == formData.accountId);
            if (!selectedAccount || !this.isAccountActive(selectedAccount)) {
                this.alertService.error('Only active accounts can be assigned to employees');
                return;
            }
        }
        
        if (formData.status !== 'Active' && formData.status !== 'Inactive') {
            formData.status = 'Active';
        }

        this.loading = true;
        if (this.isAddMode) {
            this.createEmployee(formData);
        } else {
            this.updateEmployee(formData);
        }
    }
    
    private createEmployee(formData: any) {
        this.employeeService.create(formData)
            .pipe(first())
            .subscribe(
                (response) => {
                    this.alertService.success('Employee added successfully with automatic onboarding workflow', { keepAfterRouteChange: true });
                    this.router.navigate(['../'], { relativeTo: this.route });
                },
                error => {
                    this.alertService.error('Error adding employee: ' + error);
                    this.loading = false;
                }
            );
    }

    private updateEmployee(formData: any) {
        this.employeeService.update(this.id, formData)
            .pipe(first())
            .subscribe(
                () => {
                    this.alertService.success('Employee updated successfully', { keepAfterRouteChange: true });
                    this.router.navigate(['../../'], { relativeTo: this.route });
                },
                error => {
                    this.alertService.error('Error updating employee: ' + error);
                    this.loading = false;
                }
            );
    }
}