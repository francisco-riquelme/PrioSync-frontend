declare module "react-big-calendar" {
  import { ComponentType } from "react";

  export interface Event {
    title: string;
    start: Date;
    end: Date;
    allDay?: boolean;
    resource?: any;
  }

  export type View = "month" | "week" | "work_week" | "day" | "agenda";

  export interface CalendarProps {
    localizer: any;
    events: Event[];
    startAccessor?: string | ((event: Event) => Date);
    endAccessor?: string | ((event: Event) => Date);
    style?: React.CSSProperties;
    view?: View;
    onView?: (view: View) => void;
    date?: Date;
    onNavigate?: (date: Date) => void;
    eventPropGetter?: (event: Event) => { style?: React.CSSProperties };
    components?: any;
    onSelectSlot?: (slotInfo: any) => void;
    onSelectEvent?: (event: Event) => void;
    selectable?: boolean;
    messages?: any;
  }

  export const Calendar: ComponentType<CalendarProps>;
  export function momentLocalizer(moment: any): any;
}
