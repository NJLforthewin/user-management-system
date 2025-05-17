import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';  
import { Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms'; 
import { first } from 'rxjs/operators';
import { RouterModule } from '@angular/router';
import { EmployeeService, DepartmentService, AlertService } from '@app/_services';
import { Employee, Department } from '@app/_models';

@Component({ 
    standalone: true,  
    imports: [CommonModule, ReactiveFormsModule, RouterModule], 
    templateUrl: 'transfer.component.html' 
})
export class TransferComponent implements OnInit {
    form!: FormGroup;
    id!: number;
    employee!: Employee;
    departments: Department[] = [];
    allEmployees: Employee[] = [];
    loading = true;
    submitting = false;
    submitted = false;
    departmentCounts: { [key: string]: number } = {};

    constructor(
        private formBuilder: FormBuilder,
        private route: ActivatedRoute,
        private router: Router,
        private employeeService: EmployeeService,
        private departmentService: DepartmentService,
        private alertService: AlertService
    ) {}

    ngOnInit() {
        this.id = this.route.snapshot.params['id'];
        
        this.form = this.formBuilder.group({
            departmentId: ['', Validators.required]
        });
        
        this.loadEmployeeDetails();
        this.loadDepartmentsAndEmployees();
    }
    
    goBackToEmployees() {
        this.router.navigate(['/employee']);
    }
    
    private loadEmployeeDetails() {
        this.employeeService.getById(this.id)
            .pipe(first())
            .subscribe(
                employee => {
                    this.employee = employee;
                    this.loading = false;
                },
                error => {
                    this.alertService.error('Error loading employee details: ' + error);
                    this.loading = false;
                    this.router.navigate(['../../'], { relativeTo: this.route });
                }
            );
    }
    
    private loadDepartmentsAndEmployees() {
        this.departmentService.getAll()
            .pipe(first())
            .subscribe(
                departments => {
                    this.departments = departments;
                    
                    this.employeeService.getAll()
                        .pipe(first())
                        .subscribe(
                            employees => {
                                this.allEmployees = employees;
                                
                                departments.forEach(dept => {
                                    if (dept.id !== undefined) {
                                        const count = employees.filter(emp => emp.departmentId === dept.id).length;
                                        this.departmentCounts[dept.id.toString()] = count;
                                    }
                                });
                            },
                            error => this.alertService.error('Error loading employees: ' + error)
                        );
                },
                error => this.alertService.error('Error loading departments: ' + error)
            );
    }

    getDepartmentCount(departmentId: number): number {
        return this.departmentCounts[departmentId.toString()] || 0;
    }

    get f() { return this.form.controls; }

    onSubmit() {
        this.submitted = true;
        this.alertService.clear();

        if (this.form.invalid) {
            return;
        }

        const newDepartmentId = parseInt(this.form.value.departmentId);
        
        if (this.employee.departmentId === newDepartmentId) {
            this.alertService.error('Employee is already in this department');
            return;
        }
        
        this.submitting = true;
        
        // Use transfer method instead of update
        this.employeeService.transfer(this.id, newDepartmentId)
            .pipe(first())
            .subscribe(
                (response: any) => {
                    this.alertService.success(
                        `Employee transferred successfully. A workflow (ID: ${response.workflow?.id || 'N/A'}) has been created with 'Pending' status.`, 
                        { keepAfterRouteChange: true }
                    );
                    
                    // Update local department counts with the response data
                    if (response.departmentCounts) {
                        Object.keys(response.departmentCounts).forEach(deptId => {
                            this.departmentCounts[deptId] = response.departmentCounts[deptId];
                        });
                    }
                    
                    this.router.navigate(['../../details', this.id], { relativeTo: this.route });
                },
                error => {
                    this.alertService.error('Error transferring employee: ' + error);
                    this.submitting = false;
                }
            );
    }
}