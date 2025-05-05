// src/app/shared/maintenance/maintenance.component.ts
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-maintenance',
  templateUrl: './maintenance.component.html',
  styleUrls: ['./maintenance.component.scss']
})
export class MaintenanceComponent implements OnInit {
  currentTime: string = '';
  refreshing: boolean = false;

  constructor() { }

  ngOnInit(): void {
    this.updateTime();
  }

  updateTime(): void {
    this.currentTime = new Date().toLocaleString();
  }

  refresh(): void {
    this.refreshing = true;
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }
}