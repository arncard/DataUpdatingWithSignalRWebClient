import { IRetryPolicy, RetryContext } from '@microsoft/signalr';

export class RandomRetryPolicy implements IRetryPolicy
{
    timeInMiliseconds = 60000;
    nextRetryDelayInMilliseconds(retryContext: RetryContext): number 
    {
        // If we've been reconnecting for less than 60 seconds so far,
        // wait between 0 and 10 seconds before the next reconnect attempt.
        if(retryContext.elapsedMilliseconds < this.timeInMiliseconds)
        {
            console.log("Trying to reconnect...");
            return Math.floor(Math.random() * 10);
        }
        else
        {
            // If we've been reconnecting for more than 60 seconds so far, 
            // stop reconnecting.            
            return null;
        }
    }
    
}