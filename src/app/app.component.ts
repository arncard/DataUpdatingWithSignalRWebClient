import { Component, OnInit } from '@angular/core';
import { SignalRService } from './services/signal-r.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'SiteSubscriptionWebClient';
  subscribed: string;

  constructor(public signalRService: SignalRService, private http: HttpClient) {    
    
  }

  ngOnInit()
  {
    this.signalRService.startConnection();
    this.subscribed = this.signalRService.addSiteDataListener();
  }
}
