import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AccountService } from '../_services/account.service';

@Component({ 
    templateUrl: 'home.component.html',
    styles: [`
      .home-container {
        background-color: #f8f9fa;
        min-height: 100vh;
        padding-bottom: 2rem;
      }
      
      .welcome-card {
        background-image: linear-gradient(to right, rgba(255,255,255,0.95), rgba(255,255,255,0.9));
      }
      
      .decoration-circle {
        width: 200px;
        height: 200px;
        border-radius: 50%;
        right: -50px;
        bottom: -50px;
        z-index: -1;
      }
      
      .decoration-dots {
        width: 150px;
        height: 150px;
        background-image: radial-gradient(#0d6efd 2px, transparent 2px);
        background-size: 15px 15px;
        left: -20px;
        top: -20px;
        opacity: 0.3;
        z-index: -1;
      }
      
      .stat-icon, .activity-icon {
        width: 50px;
        height: 50px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
      }
      
      .activity-icon {
        min-width: 40px;
        width: 40px;
        height: 40px;
        font-size: 1.2rem;
      }
      
      @media (max-width: 992px) {
        .decoration-circle {
          width: 150px;
          height: 150px;
        }
        
        .decoration-dots {
          width: 100px;
          height: 100px;
        }
      }
    `]
})
export class HomeComponent implements OnInit {
    account: any;
    
    totalEmployees = 0;
    totalDepartments = 0;
    totalWorkflows = 0;
    totalRequests = 0;
    
    employeeGrowth = 0; 
    departmentGrowth = 0;
    workflowGrowth = 0;
    requestGrowth = 0;
    
    pendingWorkflows = 0;
    approvedWorkflows = 0;
    rejectedWorkflows = 0;
    
    recentActivities: any[] = [];
    
    loading = {
        employees: true,
        departments: true,
        workflows: true,
        requests: true
    };

    constructor(
        private accountService: AccountService
    ) {       
        this.account = this.accountService.accountValue; 
    }

    ngOnInit() {
        // Mock data for demo
        setTimeout(() => {
            this.totalEmployees = 15;
            this.totalDepartments = 4;
            this.totalWorkflows = 9;
            this.totalRequests = 3;
            
            this.employeeGrowth = 2;
            this.departmentGrowth = 1;
            this.workflowGrowth = 0;
            this.requestGrowth = -1;
            
            this.pendingWorkflows = 4;
            this.approvedWorkflows = 3;
            this.rejectedWorkflows = 2;
            
            this.recentActivities = [
                {
                    id: 1,
                    title: 'New employee John Smith was added',
                    timestamp: new Date(Date.now() - 7200000), // 2 hours ago
                    bgClass: 'bg-primary',
                    icon: 'bi-person-plus'
                },
                {
                    id: 2,
                    title: 'Transfer request for Mike Johnson was approved',
                    timestamp: new Date(Date.now() - 86400000), // 1 day ago
                    bgClass: 'bg-success',
                    icon: 'bi-check-circle'
                },
                {
                    id: 3,
                    title: 'New onboarding workflow created',
                    timestamp: new Date(Date.now() - 259200000), // 3 days ago
                    bgClass: 'bg-warning',
                    icon: 'bi-exclamation-circle'
                }
            ];
            
            this.loading = {
                employees: false,
                departments: false,
                workflows: false,
                requests: false
            };
        }, 1000);
    }
    
    formatTimeAgo(date: string | Date | undefined): string {
        if (!date) {
            return 'Unknown time';
        }
        
        const now = new Date();
        const activityDate = new Date(date.toString());
        const diffTime = Math.abs(now.getTime() - activityDate.getTime());
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
        const diffMinutes = Math.floor(diffTime / (1000 * 60));
        
        if (diffMinutes < 60) {
            return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
        } else if (diffHours < 24) {
            return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
        } else {
            return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
        }
    }
    
    getPercentage(count: number): number {
        const total = this.totalWorkflows || 1;
        return Math.round((count / total) * 100);
    }
    
    getGrowthClass(growth: number): string {
        if (growth > 0) return 'text-success';
        if (growth < 0) return 'text-danger';
        return 'text-warning';
    }
    
    getGrowthIcon(growth: number): string {
        if (growth > 0) return 'bi-arrow-up';
        if (growth < 0) return 'bi-arrow-down';
        return 'bi-dash';
    }
}