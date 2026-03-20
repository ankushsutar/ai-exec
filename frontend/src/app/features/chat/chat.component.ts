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
    abortController?: AbortController;

    Highcharts: typeof Highcharts = Highcharts;
    chartOptionsMap = new Map<number, Highcharts.Options>();

    getChartOptions(index: number): Highcharts.Options {
        return this.chartOptionsMap.get(index) as Highcharts.Options;
    }

    suggestions = [
        "Total revenue for this month",
        "Show me the devices which has revenue less than 1500000",
        "Which 5 devices have the most transactions?",
        "Show volume for UPI vs Card transactions",
        "Daily transaction volume last 30 days",
        "Top 10 devices by revenue",
        "Peak hours of transaction volume last 7 days",
        "top performing device in feb 2025",
        "top perfroming device in feb 2026",
        "daily transaction volume in jan 2026",
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

        // Create a new AbortController for this request
        this.abortController = new AbortController();

        this.apiService.askData(currentQuestion).subscribe({
            next: (dataResponse) => {
                // If the user aborted before getting data, don't proceed
                if (this.abortController?.signal.aborted) {
                    this.isLoading = false;
                    this.cdr.detectChanges();
                    return;
                }

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

                // Keep isLoading true because we are still streaming the summary
                // But we manually trigger detection so the chart shows up
                this.cdr.detectChanges();
                this.scrollToBottom();

                // 3. Request the LLM Summary in the background (Streaming)
                // Start with an empty summary so we can append
                if (this.messages[msgIndex] && this.messages[msgIndex].data) {
                    this.messages[msgIndex].data!.summary = '';
                }

                this.apiService.askSummaryStream(dataResponse, currentQuestion, this.abortController!.signal).subscribe({
                    next: (chunk: string) => {
                        // Append each new word/token to the summary in real-time
                        if (this.messages[msgIndex] && this.messages[msgIndex].data) {
                            this.messages[msgIndex].data!.summary += chunk;
                            this.cdr.detectChanges(); // Tell Angular to render new chunk
                            this.scrollToBottom();
                        }
                    },
                    error: (err: any) => {
                        this.isLoading = false;
                        console.error('LLM Summary stream error:', err);
                        if (this.messages[msgIndex] && this.messages[msgIndex].data) {
                            this.messages[msgIndex].data!.summary += '\n\n[Analysis generation failed or timed out.]';
                            this.cdr.detectChanges();
                        }
                    },
                    complete: () => {
                        this.isLoading = false;
                        // When stream finishes, set final confidence score
                        if (this.messages[msgIndex] && this.messages[msgIndex].data) {
                            this.messages[msgIndex].data!.confidence = 0.95; // Hardcoded default confidence

                            // Explicitly mark aborted if the user stopped it early
                            if (this.abortController?.signal?.aborted) {
                                this.messages[msgIndex].data!.summary += ' [Aborted by User]';
                            }

                            this.cdr.detectChanges();
                        }
                    }
                });
            },
            error: (err: any) => {
                this.messages.push({
                    role: 'system',
                    content: 'An error occurred while fetching data. Please try again.'
                });
                this.isLoading = false;
                this.cdr.detectChanges();
                console.error(err);
            }
        });
    }

    stopGenerating(): void {
        if (this.abortController) {
            this.abortController.abort();
            this.isLoading = false;
            this.cdr.detectChanges();
        }
    }

    generateChartOptions(chartData: any[], title: string): Highcharts.Options {
        const categories = chartData.map(d => d.label);
        const data = chartData.map(d => d.value);

        // Use 'column' (Bar Chart) as requested for all analytics
        const type: any = 'column';

        return {
            chart: {
                type: type,
                style: { fontFamily: 'inherit' },
                borderRadius: 12,
                backgroundColor: '#ffffff'
            },
            title: { text: '' },
            xAxis: {
                categories,
                crosshair: true,
                labels: {
                    style: { fontSize: '10px' },
                    rotation: chartData.length > 10 ? -45 : 0
                }
            },
            yAxis: {
                min: 0,
                title: { text: undefined },
                gridLineColor: '#f1f5f9'
            },
            tooltip: {
                headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
                pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td><td style="padding:0"><b>{point.y}</b></td></tr>',
                footerFormat: '</table>',
                shared: true,
                useHTML: true,
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderRadius: 8,
                borderWidth: 0,
                shadow: true
            },
            plotOptions: {
                column: { 
                    pointPadding: 0.2, 
                    borderWidth: 0, 
                    borderRadius: 4,
                    color: '#2563eb' // Primary Blue
                }
            },
            series: [{
                type: 'column',
                name: 'Value',
                data: data,
                color: '#2563eb'
            }],
            credits: { enabled: false },
            legend: { enabled: false }
        };
    }
}
