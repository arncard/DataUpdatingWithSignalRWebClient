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
  public subscriptionData: string[] = [];
  connectionMessages: string;
  connectionClosed: string;
  connectionStarted: boolean = false;
  serverUrl: string = 'https://localhost:5001/hubs/site'; //"https://testapp3.gensolve.com/hubs/site";
  private hubConnection: signalR.HubConnection;  

  constructor() { 
    this.data = [];
    this.subscriptionData = [];
  }


  // startConnection = (selectedSiteEvent: string) => {
  //   if(this.hubConnection !== undefined && this.hubConnection !== null)
  //   {

  //   }
  // }

  // this function is called before every HTTP request made by SignalR.
  // If the token renovation is needed to keep the connection active (due to expiration),
  // do it here
  private getAccessToken(): string{
    return "accesstokensignalr";
  }

   //WithAutomaticReconnect() configures the client to wait 0, 2, 10, and 30 seconds respectively 
   //before trying each reconnect attempt, stopping after four failed attempts.
  public startConnection = () => {    
    this.hubConnection = new signalR.HubConnectionBuilder()
    .withUrl(this.serverUrl, { accessTokenFactory: this.getAccessToken, skipNegotiation: true,
              transport: signalR.HttpTransportType.WebSockets })
    .withAutomaticReconnect(new RandomRetryPolicy())
    .configureLogging(signalR.LogLevel.Debug)
    .build();


    this.hubConnection
    .start()
    .then(() => {
      console.log('Connection started');
      //this.connectionStarted = true;
      //this.joinSiteGroup(selectedSiteEvent);
    })
    .catch(_ => {
      //this.connectionStarted = false;
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
      // Here the signalR connection is the same as before the connection failure,
      // test if it needs to re-subscribe again
      if(this.hubConnection.state === signalR.HubConnectionState.Connected)
      {
        this.connectionMessages = `[${new Date()}] The connection was restablished ${connectionId ? "with Id: "+ connectionId:""}`;
      }      
    });    

    // if the client fails, the server executes the hub's onDisconnected method and queues up a disconnect message to send to the client
    // If the client can reconnect, here it receives the disconnect message and calls stop()
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
                .then(() => {
                  console.log('Connection started'); 
                  this.connectionClosed = ""; this.connectionMessages = "Connection started again"; 


                  // re-subscribe to the current site!!!
                  
                })
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

  joinSiteGroup(selectedSiteEvent: string)
  {
    if(this.hubConnection !== undefined && this.hubConnection !== null && this.hubConnection.state === signalR.HubConnectionState.Connected)
    {
      this.hubConnection.invoke("JoinSiteGroup", selectedSiteEvent).then(function(connectionId){
        console.log("ConnectionId: " + connectionId);
      })
    }    
  }

  leaveSiteGroup(selectedSiteEvent: string)
  {
    if(this.hubConnection !== undefined && this.hubConnection !== null)
    {
      this.hubConnection.invoke("LeaveSiteGroup", selectedSiteEvent).then(function(connectionId){
        console.log("ConnectionId: " + connectionId);
      })
    }    
  }

  // subscribe to the transfercalendardata event and accept the 
  // data from the server with the data parameter
  public addSiteDataListener = (selectedSiteEvent: string): string => {
    let site = SiteManager.GetSiteListData().find(x=>x.eventName === selectedSiteEvent);
    //this.hubConnection.on(selectedSiteEvent, this.subscriptionHandler);
    this.joinSiteGroup(selectedSiteEvent);
    
    this.hubConnection.on(selectedSiteEvent, (message) => {
      this.data.push(message);
      console.log(message);
    });
    
    //this.subscriptionData.push(selectedSiteEvent);
    return `You are subscribed to the site ${site.name}`;
  }

  // updateSubscriptionData(selectedSiteEvent: string)
  // {
  //   if(this.subscriptionData.length > 0 && this.subscriptionData.findIndex(e => e == selectedSiteEvent) >= 0)
  //   {
  //     let lastthis.data[this.data.length - 1];
  //   }
  // }

  subscriptionHandler(message: string)
  {
    this.data.push(message);
    console.log(message);
  }

  public removeSiteDataListener = (selectedSiteEvent: string) => {
    // connection.off removes the handler, the passed Function MUST be the same as the one passed to on()
    //this.hubConnection.off(selectedSiteEvent);
    this.leaveSiteGroup(selectedSiteEvent);
    this.hubConnection.off(selectedSiteEvent, (message) => {
      this.data.push(message);
      console.log(message);          
    });    
    console.log("Unsubscribed message");  
  }

  getRandomSite(): Site
  {
    let sitesList = SiteManager.GetSiteListData();
    let index = Math.floor(Math.random() * (sitesList.length - 1));
    let site = sitesList[index];
    return site;
  }

  endConnection = () => {
    if(this.hubConnection !== undefined && this.hubConnection.state === signalR.HubConnectionState.Connected)
    {
      this.hubConnection.stop();
    }
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