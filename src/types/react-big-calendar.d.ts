declare module "react-big-calendar" {
  import { ComponentType } from "react";

  export interface SlotInfo {
    start: Date;
    end: Date;
    slots: Date[];
    action: "select" | "click" | "doubleClick";
  }

  export interface Event {
    title: string;
    start: Date;
    end: Date;
    allDay?: boolean;
    resource?: unknown;
  }

  export type View = "month" | "week" | "work_week" | "day" | "agenda";

  export interface CalendarProps {
    localizer: object;
    events: Event[];
    startAccessor?: string | ((event: Event) => Date);
    endAccessor?: string | ((event: Event) => Date);
    onSelectSlot?: (slotInfo: SlotInfo) => void;
    view?: View;
    onView?: (view: View) => void;
    date?: Date;
    onNavigate?: (date: Date) => void;
    eventPropGetter?: (event: Event) => { style?: React.CSSProperties };
    components?: Partial<CalendarComponents>;
    onSelectSlot?: (slotInfo: SlotInfo) => void;
    onSelectEvent?: (event: Event) => void;
    selectable?: boolean;
    messages?: Record<string, string>;
  }

  export const Calendar: ComponentType<CalendarProps>;
  export function momentLocalizer(moment: import("moment").Moment): object;
}
