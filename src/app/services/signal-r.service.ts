import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { BehaviorSubject } from 'rxjs';
import { Site } from '../models/site';
import { SiteManager } from '../data-manager/site-manager';
import { sanitizeScript } from '@angular/core/src/sanitization/sanitization';
import { RandomRetryPolicy } from '../connection-retry-policy/random-retry-policy';

@Injectable({
  providedIn: 'root'
})
export class SignalRService {
  // It holds the data fetched from the server  
  public data: string[] = [];
  connectionMessages: string;
  connectionClosed: string;
  private hubConnection: signalR.HubConnection;  
  //public dataListChange = new BehaviorSubject<SchedulerEvent[]>(this.data);
  //dataListChange$ = this.dataListChange.asObservable();

  public startConnection = () => {
    this.hubConnection = new signalR.HubConnectionBuilder()
    .withUrl('https://localhost:5001/hubs/site')
    .withAutomaticReconnect(new RandomRetryPolicy())    
    .build();

    this.hubConnection
    .start()
    .then(() => console.log('Connection started'))
    .catch(_ => {
      console.log('Connection error, starting connection manually');
      setTimeout(() => {
        this.hubConnection.start();
      }, 1000)
    })
    
    //#region connection handling
    this.hubConnection.onreconnecting((error?: Error) => 
    {
      if(this.hubConnection.state === signalR.HubConnectionState.Reconnecting)
      {
        this.connectionMessages = `[${new Date()}] Starting a reconnection event... ${error ? error.message:""}`;
      }
      console.log(`Reconnecting... ${error ? error.message:""}`);
    });

    this.hubConnection.onreconnected((connectionId?: string) => 
    {
      if(this.hubConnection.state === signalR.HubConnectionState.Connected)
      {
        this.connectionMessages = `[${new Date()}] The connection was restablished ${connectionId ? "with Id: "+ connectionId:""}`;
      }      
    });

    this.hubConnection.onclose((error?: Error) => 
    {
      if(this.hubConnection.state === signalR.HubConnectionState.Disconnected)
      {
        this.connectionClosed = `[${new Date()}] The connection has been closed... ${error?error.message:""}`;        
        // waiting for some random delay to prevent overloading the server
        //setTimeout(() => {}, Math.floor(Math.random() * 5000));
        console.log("CONNECTION CLOSED, WAITING...");
        setTimeout(() => 
        { 
          this.hubConnection
                .start()
                .then(() => {console.log('Connection started');this.connectionClosed = ""; })
                .catch(_ => {
                  console.log('Connection error, starting connection manually');
                  setTimeout(() => {
                    this.hubConnection.start();
                  }, 1000)
                })
        }, 60000);
        // Try to restart manually
        this.connectionMessages = "Trying to reconnect manually.";        
      }      
    });
    //#endregion connection handling
  }

  

  // subscribe to the transfercalendardata event and accept the 
  // data from the server with the data parameter
  public addSiteDataListener = (): string => {
    let site = this.getRandomSite();
    this.hubConnection.on(site.eventName, (message) => {
      this.data.push(message);
      console.log(message);
    })
    return `You are subscribed to the site ${site.name}`;
  }

  getRandomSite(): Site
  {
    let sitesList = SiteManager.GetSiteListData();
    let index = Math.floor(Math.random() * (sitesList.length - 1));
    let site = sitesList[index];
    return site;
  }


  // public broadcastCalendarData = () => {
  //   // extract only required properties from the data object
  //   const data = this.data.map(m => {
  //     const temp = {
  //       id: m.id,
  //       title: m.title,
  //       start: m.start,
  //       end: m.end,
  //       recurrenceRule: m.recurrenceRule
  //     }
  //     return temp;
  //   });
  //   // send data to the hub endpoint
  //   this.hubConnection.invoke('broadcastcalendardata', data)
  //     .catch(err => console.log(err));
  // } 

  // public addbBroadcastCalendarDataListener = () => {
  //   this.hubConnection.on('broadcastcalendardata', (data) => 
  //   {
  //     this.data = data;
  //     this.broadcastedData = data;
 
  //     this.dataListChange.next(this.data);
  //   })
  // }
}