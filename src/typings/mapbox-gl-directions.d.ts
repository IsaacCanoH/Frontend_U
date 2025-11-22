declare module '@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions' {
  import type { IControl, LngLatLike } from 'mapbox-gl';

  interface DirectionsOptions {
    accessToken: string;
    unit?: 'metric' | 'imperial';
    profile?: 'mapbox/driving' | 'mapbox/walking' | 'mapbox/cycling' | string;
    controls?: { inputs?: boolean; instructions?: boolean; profileSwitcher?: boolean };
    alternatives?: boolean;
    congestion?: boolean;
    annotations?: boolean;
    interactive?: boolean;
    flyTo?: boolean;
    placeholderOrigin?: string;
    placeholderDestination?: string;
  }

  export default class MapboxDirections implements IControl {
    constructor(options: DirectionsOptions);
    onAdd(map: any): HTMLElement;
    onRemove(): void;
    setOrigin(origin: LngLatLike | string): void;
    setDestination(dest: LngLatLike | string): void;
    setProfile(profile: string): void;
  }
}
