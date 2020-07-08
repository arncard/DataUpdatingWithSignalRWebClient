import { Component, OnInit } from '@angular/core';
import { SignalRService } from './services/signal-r.service';
import { HttpClient } from '@angular/common/http';
import { SiteManager } from './data-manager/site-manager';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'SiteSubscriptionWebClient';
  subscribed: string;
  currentSubscription: string = "";
  selectedSiteEvent: string = "";
  sitesList = SiteManager.GetSiteListData();
  constructor(public signalRService: SignalRService, private http: HttpClient) {    
    
  }

  ngOnInit()
  {
    this.signalRService.startConnection();
    ////this.subscribed = this.signalRService.addSiteDataListener();
  }

  subscribe()
  {   
    //this.signalRService.startConnection(this.selectedSiteEvent); 

    // allow only one subscription to the event
    if(this.selectedSiteEvent !== this.currentSubscription)
    {
      if(this.currentSubscription !== "")
      {
        this.signalRService.removeSiteDataListener(this.currentSubscription);
        this.subscribed = undefined;
      }      
      this.currentSubscription = this.selectedSiteEvent;
      this.subscribed = this.signalRService.addSiteDataListener(this.selectedSiteEvent);
    }        
  }
}
