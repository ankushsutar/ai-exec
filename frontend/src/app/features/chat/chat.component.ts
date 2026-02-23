import { Component, inject, OnInit, ChangeDetectorRef, ChangeDetectionStrategy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, AskDataResponse, AskSummaryResponse } from '../../core/services/api.service';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { KpiCardComponent } from '../../shared/components/kpi-card/kpi-card.component';
import { HighchartsChartComponent } from 'highcharts-angular';
import * as Highcharts from 'highcharts';

interface ChatMessage {
    role: 'user' | 'system';
    content?: string;
    data?: AskDataResponse & Partial<AskSummaryResponse>;
}

@Component({
    selector: 'app-chat',
    standalone: true,
    imports: [CommonModule, FormsModule, LoadingSpinnerComponent, KpiCardComponent, HighchartsChartComponent],
    templateUrl: './chat.component.html',
    styleUrl: './chat.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChatComponent implements OnInit, AfterViewChecked {
    private apiService = inject(ApiService);
    private cdr = inject(ChangeDetectorRef);

    @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

    messages: ChatMessage[] = [];
    question: string = '';
    isLoading: boolean = false;

    Highcharts: typeof Highcharts = Highcharts;
    chartOptionsMap = new Map<number, Highcharts.Options>();

    getChartOptions(index: number): Highcharts.Options {
        return this.chartOptionsMap.get(index) as Highcharts.Options;
    }

    suggestions = [
        "Show revenue by region",
        "Show firmware failures",
        "Top merchants this month"
    ];

    ngOnInit(): void {
        // Initial welcome message
        this.messages.push({
            role: 'system',
            content: 'Welcome to the AI Executive Intelligence Interface. How can I assist you today?'
        });
    }

    ngAfterViewChecked(): void {
        this.scrollToBottom();
    }

    private scrollToBottom(): void {
        try {
            if (this.scrollContainer) {
                this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
            }
        } catch (err) { }
    }

    askSuggestion(suggestion: string): void {
        this.question = suggestion;
        this.submitQuestion();
    }

    submitQuestion(): void {
        if (!this.question.trim() || this.isLoading) return;

        const currentQuestion = this.question;
        this.question = '';

        this.messages.push({ role: 'user', content: currentQuestion });
        this.isLoading = true;
        this.cdr.detectChanges(); // Allow User text to render and scroll
        this.scrollToBottom();

        this.apiService.askData(currentQuestion).subscribe({
            next: (dataResponse) => {
                const msgIndex = this.messages.length;

                // 1. Push the Data Response immediately
                const newMessage: ChatMessage = {
                    role: 'system',
                    data: {
                        ...dataResponse,
                        summary: 'Generating analysis...',
                        confidence: 0
                    }
                };

                this.messages.push(newMessage);

                // 2. Render chart immediately
                if (dataResponse.chartData && dataResponse.chartData.length > 0) {
                    this.chartOptionsMap.set(msgIndex, this.generateChartOptions(dataResponse.chartData, currentQuestion));
                }

                // Wait for AI but stop full-page spinner
                this.isLoading = false;
                this.cdr.detectChanges(); // Force update so charts appear immediately
                this.scrollToBottom();

                // 3. Request the LLM Summary in the background (Streaming)
                if (dataResponse.intent !== 'UNKNOWN') {
                    // Start with an empty summary so we can append
                    if (this.messages[msgIndex] && this.messages[msgIndex].data) {
                        this.messages[msgIndex].data!.summary = '';
                    }

                    this.apiService.askSummaryStream(dataResponse.rawAnalytics).subscribe({
                        next: (chunk: string) => {
                            // Append each new word/token to the summary in real-time
                            if (this.messages[msgIndex] && this.messages[msgIndex].data) {
                                this.messages[msgIndex].data!.summary += chunk;
                                this.cdr.detectChanges(); // Tell Angular to render new chunk
                                this.scrollToBottom();
                            }
                        },
                        error: (err: any) => {
                            console.error('LLM Summary stream error:', err);
                            if (this.messages[msgIndex] && this.messages[msgIndex].data) {
                                this.messages[msgIndex].data!.summary += '\n\n[Analysis generation failed or timed out.]';
                                this.cdr.detectChanges();
                            }
                        },
                        complete: () => {
                            // When stream finishes, set final confidence score
                            if (this.messages[msgIndex] && this.messages[msgIndex].data) {
                                this.messages[msgIndex].data!.confidence = 0.95; // Hardcoded default confidence
                                this.cdr.detectChanges();
                            }
                        }
                    });
                } else {
                    if (this.messages[msgIndex] && this.messages[msgIndex].data) {
                        this.messages[msgIndex].data!.summary = "I could not understand the question. Please ask about revenue by region, firmware failures, or top merchants.";
                    }
                }
            },
            error: (err: any) => {
                this.messages.push({
                    role: 'system',
                    content: 'An error occurred while fetching data. Please try again.'
                });
                this.isLoading = false;
                console.error(err);
            }
        });
    }

    generateChartOptions(chartData: any[], title: string): Highcharts.Options {
        const categories = chartData.map(d => d.label);
        const data = chartData.map(d => d.value);

        return {
            chart: { type: 'column', style: { fontFamily: 'inherit' }, borderRadius: 8 },
            title: { text: '' },
            xAxis: { categories, crosshair: true },
            yAxis: { min: 0, title: { text: 'Value' } },
            tooltip: {
                headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
                pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td><td style="padding:0"><b>{point.y}</b></td></tr>',
                footerFormat: '</table>',
                shared: true,
                useHTML: true
            },
            plotOptions: {
                column: { pointPadding: 0.2, borderWidth: 0, borderRadius: 4 }
            },
            series: [{
                type: 'column',
                name: 'Metric',
                data: data,
                color: '#2563eb'
            }],
            credits: { enabled: false }
        };
    }
}
