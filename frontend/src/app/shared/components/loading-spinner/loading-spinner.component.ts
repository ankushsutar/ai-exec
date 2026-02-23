import { Component } from '@angular/core';

@Component({
    selector: 'app-loading-spinner',
    standalone: true,
    template: `
    <div class="flex items-center space-x-2 p-4 bg-gray-50 rounded-2xl rounded-tl-none inline-flex">
      <div class="w-2.5 h-2.5 bg-blue-600 rounded-full animate-bounce" style="animation-delay: 0s"></div>
      <div class="w-2.5 h-2.5 bg-blue-600 rounded-full animate-bounce" style="animation-delay: 0.15s"></div>
      <div class="w-2.5 h-2.5 bg-blue-600 rounded-full animate-bounce" style="animation-delay: 0.3s"></div>
    </div>
  `,
    styles: []
})
export class LoadingSpinnerComponent { }
