import { Component, ElementRef, EventEmitter, OnDestroy, OnInit, Output, ViewChild, Input, OnChanges, SimpleChanges } from '@angular/core';
import mapboxgl, { Map as MapboxMap, Marker, LngLatLike } from 'mapbox-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-mapa-seleccion',
  templateUrl: './mapa-seleccion.component.html',
  styleUrls: ['./mapa-seleccion.component.scss']
})
export class MapaSeleccionComponent implements OnInit, OnDestroy, OnChanges {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef<HTMLDivElement>;
  @Input() initialCoords: [number, number] | null = null;
  @Input() searchText: string | null = null;
  @Output() coordenadasChange = new EventEmitter<{ lng: number; lat: number }>();

  private map?: MapboxMap;
  private marker?: Marker;
  private geocoder?: MapboxGeocoder;

  isMapLoading = true;
  isDataLoading = false;

  ngOnInit(): void {
    (mapboxgl as any).accessToken = environment.mapboxToken;

    const startCenter: LngLatLike = this.initialCoords ?? [-99.1332, 19.4326];
    const startZoom = this.initialCoords ? 16 : 12;

    this.map = new mapboxgl.Map({
      container: this.mapContainer.nativeElement,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: startCenter,
      zoom: startZoom
    });

    this.map.addControl(new mapboxgl.NavigationControl());

    this.geocoder = new MapboxGeocoder({
      accessToken: environment.mapboxToken,
      mapboxgl: mapboxgl as any,
      marker: false,
      language: 'es',
      countries: 'mx',
      proximity: { longitude: -99.1332, latitude: 19.4326 }
    });

    this.map.addControl(this.geocoder, 'top-left');

    this.geocoder.on('result', (e: any) => {
      const center = e?.result?.center as [number, number] | undefined;
      if (!center || !this.map) return;
      this.isDataLoading = true;
      this.setMarker(center);
      this.map.flyTo({ center, zoom: 16 });
      this.map.once('moveend', () => (this.isDataLoading = false));
      this.emitCurrentCoords();
    });

    this.map.on('load', () => {
      if (this.initialCoords) this.setMarker(this.initialCoords);
      this.isMapLoading = false;
    });

    this.map.on('click', (ev) => {
      const lngLat: [number, number] = [ev.lngLat.lng, ev.lngLat.lat];
      this.isDataLoading = true;
      this.setMarker(lngLat);
      this.emitCurrentCoords();
      setTimeout(() => (this.isDataLoading = false), 150);
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['searchText']) {
      const q = (this.searchText ?? '').trim();
      if (q && this.map) this.findByAddress(q);
    }
    if (changes['initialCoords'] && changes['initialCoords'].currentValue && this.map) {
      const coords = changes['initialCoords'].currentValue as [number, number];
      this.isDataLoading = true;
      this.setMarker(coords);
      this.map.jumpTo({ center: coords, zoom: 16 });
      setTimeout(() => (this.isDataLoading = false), 150);
    }
  }

  private async findByAddress(q: string): Promise<void> {
    try {
      this.isDataLoading = true;
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?access_token=${environment.mapboxToken}&language=es&country=mx&limit=1`;
      const resp = await fetch(url);
      const data = await resp.json();
      const center = data?.features?.[0]?.center as [number, number] | undefined;
      if (!center || !this.map) { this.isDataLoading = false; return; }
      this.setMarker(center);
      this.map.flyTo({ center, zoom: 16 });
      this.map.once('moveend', () => (this.isDataLoading = false));
      this.emitCurrentCoords();
    } catch {
      this.isDataLoading = false;
    }
  }

  private setMarker(coords: [number, number]): void {
    if (!this.map) return;
    if (!this.marker) {
      this.marker = new mapboxgl.Marker({ draggable: true })
        .setLngLat(coords)
        .addTo(this.map);
      this.marker.on('dragend', () => this.emitCurrentCoords());
    } else {
      this.marker.setLngLat(coords);
    }
  }

  private emitCurrentCoords(): void {
    const pos = this.marker?.getLngLat();
    if (!pos) return;
    this.coordenadasChange.emit({ lng: pos.lng, lat: pos.lat });
  }

  ngOnDestroy(): void {
    this.marker?.remove();
    if (this.map && this.geocoder) this.map.removeControl(this.geocoder);
    this.map?.remove();
  }
}
