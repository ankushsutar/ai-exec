import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AskDataResponse {
    kpis: any[];
    chartData: any[];
    intent: string;
    rawAnalytics: any;
}

export interface AskSummaryResponse {
    summary: string;
    confidence: number;
}

@Injectable({
    providedIn: 'root'
})
export class ApiService {
    private http = inject(HttpClient);
    private backendUrl = 'http://localhost:3000';

    askData(question: string): Observable<AskDataResponse> {
        return this.http.post<AskDataResponse>(`${this.backendUrl}/ask/data`, { question });
    }

    askSummaryStream(analytics: any): Observable<string> {
        return new Observable<string>(observer => {
            fetch(`${this.backendUrl}/ask/summary`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ analytics })
            }).then(async response => {
                if (!response.body) throw new Error('ReadableStream not supported.');
                const reader = response.body.getReader();
                const decoder = new TextDecoder('utf-8');
                let done = false;

                while (!done) {
                    const { value, done: readerDone } = await reader.read();
                    done = readerDone;
                    if (value) {
                        const chunk = decoder.decode(value, { stream: true });
                        const lines = chunk.split('\n').filter(line => line.trim() !== '');
                        for (const line of lines) {
                            try {
                                const parsed = JSON.parse(line);
                                if (parsed.response) {
                                    observer.next(parsed.response);
                                }
                            } catch (e) {
                                // Ignore incomplete JSON pieces
                                console.warn('Stream parse error:', e);
                            }
                        }
                    }
                }
                observer.complete();
            }).catch(err => {
                observer.error(err);
            });
        });
    }
}
