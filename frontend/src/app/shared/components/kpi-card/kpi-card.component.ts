import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col justify-between h-full transition-all hover:shadow-md">
      <h3 class="text-xs font-medium text-gray-500 mb-1.5">{{ title }}</h3>
      <div class="flex items-baseline gap-2">
        <span class="text-2xl font-bold text-gray-900">{{ formatValue(value) }}</span>
      </div>
    </div>
  `,
  styles: []
})
export class KpiCardComponent {
  @Input() title: string = '';
  @Input() value: any;

  formatValue(val: any): string {
    if (typeof val === 'number') {
      if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
      if (val >= 1000) return (val / 1000).toFixed(1) + 'k';
      if (val % 1 !== 0) return val.toFixed(2);
      return val.toString();
    }
    return val;
  }
}
