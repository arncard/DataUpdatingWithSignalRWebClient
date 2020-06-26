import { Site } from '../models/site';

export class SiteManager
{
    static GetSiteListData(): Site[]
    {
        return [ { id: 1, name: "Koala Beach", eventName: "koalabeachevent" },
                 { id: 2, name: "Orange", eventName: "orangeevent" },
                 { id: 3, name: "Kangaroo", eventName: "kangarooevent" },
                 { id: 4, name: "Cornerstone", eventName: "cornerstoneevent" } ];
    }
}