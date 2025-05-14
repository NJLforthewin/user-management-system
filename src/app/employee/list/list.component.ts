import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { RouterModule } from '@angular/router'; 
import { first } from 'rxjs/operators';

import { EmployeeService, AlertService } from '@app/_services';
import { Employee } from '@app/_models';

@Component({ 
    standalone: true, 
    imports: [CommonModule, RouterModule], 
    templateUrl: 'list.component.html' 
})
export class ListComponent implements OnInit {
    employees: Employee[] = [];
    loading = false;
    deleting = false;

    constructor(
        private employeeService: EmployeeService,
        private alertService: AlertService
    ) { }

    ngOnInit() {
        this.loading = true;
        this.loadEmployees();
    }

    private loadEmployees() {
        this.employeeService.getAll()
            .pipe(first())
            .subscribe(
                employees => {
                    this.employees = employees;
                    this.loading = false;
                },
                error => {
                    this.alertService.error('Error loading employees: ' + error);
                    this.loading = false;
                }
            );
    }

    deleteEmployee(id: number) {
        if (confirm('Are you sure you want to delete this employee? This action cannot be undone.')) {
            this.deleting = true;
            this.employeeService.delete(id)
                .pipe(first())
                .subscribe(
                    () => {
                        this.alertService.success('Employee deleted successfully');
                        this.employees = this.employees.filter(x => x.id !== id);
                        this.deleting = false;
                    },
                    error => {
                        this.alertService.error('Error deleting employee: ' + error);
                        this.deleting = false;
                    }
                );
        }
    }
}