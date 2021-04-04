import { Page } from '../../../shared/models/page.model';
import { SearchFilterFormMap } from '../../../shared/models/search-filter-form-map.model';
import { MinMaxSlider } from '../../../shared/models/min-max-slider.model';
import { Selection } from '../../../shared/models/selection.model';
import { filter, debounceTime, throttle } from 'rxjs/operators';
import { AudioWebService } from '../../../shared/services/web-services/audio-web.service';
import { LocalStoreService } from '../../../shared/services/local-store.service';
import { JwtAuthService } from 'app/shared/services/auth/jwt-auth.service';
import { LayoutService } from '../../../shared/services/layout.service';
import { SampleSearchQuery } from 'app/shared/models/sample-search-query.model';

import { ComponentCommunicationService } from '../../../shared/services/component-communication.service';
import { AudioService } from '../../../shared/services/audio.service';
import { delay, share, takeUntil } from 'rxjs/operators';
import { PlayStateControlService } from '../../../shared/services/play-state-control.service';
import { QueryList, ViewChildren, Renderer2, AfterViewInit, ChangeDetectorRef, AfterViewChecked, ChangeDetectionStrategy, ViewEncapsulation, HostListener, OnDestroy } from '@angular/core';
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { MatSidenav } from '@angular/material/sidenav';
import { MatSnackBar } from '@angular/material/snack-bar';
import { egretAnimations } from 'app/shared/animations/egret-animations';
import { AppLoaderService } from 'app/shared/services/app-loader/app-loader.service';
import { Observable, Subscription, BehaviorSubject, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { SampleLicensingMarketService } from '../sample-licensing-market.service';
import { Sample } from 'app/shared/models/sample.model';
import { AudioState } from 'app/shared/models/audio-state.model';
import { MatSlider, MatSliderChange } from '@angular/material/slider';
import { CloudService } from 'app/shared/services/cloud-service.service';
import { MatAutocomplete, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatOption, MatOptionSelectionChange } from '@angular/material/core';
import { SidenavContent } from 'app/shared/models/sidenav-content.model';
import { HttpErrorResponse } from '@angular/common/http';
import { style } from '@angular/animations';
// import { MinMaxSlider } from 'app/shared/models/min-max-slider.model';


@Component({
  selector: 'app-sample-market',
  templateUrl: './sample-market.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [egretAnimations],
  // tslint:disable-next-line:use-component-view-encapsulation
  encapsulation: ViewEncapsulation.None,
  // styleUrls: ['basic-licenses.component.scss']
})
export class SampleMarketComponent implements OnInit, AfterViewInit {
  public isFilterOpen: boolean = false;
  public isSideNavOpen: boolean;
  public viewMode = 'grid-view';
  public currentPage: any;
  // @ViewChildren('audioSlider', { read: MatSlider }) private audioSliders: QueryList<MatSlider>;
  // @ViewChild('featuredImage', { static: false, read: ElementRef }) private featuredImage: ElementRef;
  // @ViewChildren('.mat-slider-track-background', { read: ElementRef }) private matSliderTrackBackground: QueryList<ElementRef>;
  @ViewChild(MatSidenav) private sideNav: MatSidenav;


  private _playState: boolean;
  private _currentSampleID: string;
  // public categories$: Observable<any>;
  public genres$: Observable<string[]>;
  public activeCategory = 'all';
  public activeGenre = 'all';
  // public activeGenre: string ='all;'
  public sampleSearchQueries: SampleSearchQuery[];
  // public filterForm: FormGroup;
  public searchForm: FormGroup;
  searchString: string;
  selectionList: Array<Selection>;
  minMaxList: Array<MinMaxSlider>

  public searchFilterFormMap: SearchFilterFormMap = {
    selectionFormMap: null,
    minMaxSliderFormMap: null
  };

  responseReceived: boolean = true;
  // filterFormMap: Map<string, Array<Selection> | Array<MinMaxSlider>>;
  // selectionFormMap: Map<FormControl, Selection> = new Map<FormControl, Selection>();
  // minMaxSliderFormMap: Map<FormControl, MinMaxSlider> = new Map<FormControl, MinMaxSlider>();

  currentTime: number;
  duration: number;
  

  page: number = 1;
  pageSize: number = 12;
  sortBy: string = 'title';
  count:number = 0;

  selectedGenres: string[];
  selectedRegions: string[];
  selectedTrackTypes: string[];
  selectedSongKeys: string[];

  // tslint:disable-next-line:max-line-length
  // public genreList: string[] = ['Blues', 'Classical', 'Country', 'Electronic', 'Hip Hop/Rap', 'Jazz', 'Latin', 'Pop', 'RnB/Soul', 'Reggea', 'Rock', 'Spoken Word'];
  public regionList: string[] = ['Northern Europe', 'Western Europe', 'Southern Europe', 'Eastern Europe', 'Middle East', 'Caribbean', 'Oceania, Pacific', 'Southern Africa', 'Northern Africa', 'Western Africa', 'Eastern Africa', 'South Asia/India', 'East Asia', 'North America', 'South America', 'Central America'];
  public trackTypeList: string[] = ['Accordion', 'Bass', 'Drum', 'Edits', 'Flute', 'FX track', 'Guitar', 'Horns', 'Instrumental', 'Keyborads', 'Master', 'Percussion', 'Shruti Box', 'Sound FX', 'Strings', 'Vocals', 'Whistle'];
  
  moodsList: string[];
  genreList: string[];
  categoryList: Array<string>;
  selections: Array<Selection> = new Array<Selection>();
  // public songKeyList: string[] = ['A major', 'A minor', 'A flat major', 'A flat minor', 'B major', 'B minor', 'B flat major', 'B flat minor', 'C major', 'C minor', 'D major', 'D minor', 'D flat major', 'D flat minor', 'E major', 'E minor', 'E flat major', 'E flat minor', 'F major', 'F minor', 'G major', 'G minor', 'G flat major', 'G flat minor'];
  // public bpmMinMaxValues: string[];
  // public yearMinMaxValues: string[];


  // public mockCategories: string[] = ['Trending', 'New', 'Low Sample Price', 'Bargain', 'High Option Price', 'Trending', 'Bargain', 'Low Sample Price', 'New'];
  // public mockColors: string[] = ['grey', 'brown', 'violet', 'yellow', 'red', 'blue', 'green', 'orange', 'pink'];


  constructor(
    public sampleLicensingMarketService: SampleLicensingMarketService,
    public playStateControlService: PlayStateControlService,
    private audioService: AudioService,
    private loader: AppLoaderService,
    private changeDetectorRef: ChangeDetectorRef,
    private jwt: JwtAuthService,
    private ls: LocalStoreService,
    private audioWebService: AudioWebService,
    private fb: FormBuilder
  ) {


    this.sampleLicensingMarketService.samples$.pipe(
      // debounceTime(500),
      map((samples: Array<Sample>) => {
        if (this.playState) {
          this.playStateControlService.emitPlayState(false);
        }
        this.loader.close();
        if(samples.length > 0) {
          this.audioService.createWavesurferObj();
          this.audioService.loadPlayAudio(samples[0].sampleID);
        }
        return samples;
      }),
      takeUntil(this.sampleLicensingMarketService.sampleLicensingMarketDestroyed$),
    ).subscribe((samples: Array<Sample>) => {
      if(samples.length > 0) {
        this.initCurrentFile(samples[0].sampleID);
      }
    });

    
    this.retrieveSamples();

    // this.suggestionsSubject$.subscribe((suggestions: Array<Sample>) => {
    //   this.suggestions = suggestions;
    // });
  }

  public retrieveSamples(): void {
    const params = this.sampleLicensingMarketService.getRequestParams(this.sortBy, this.page, this.pageSize);
    this.sampleLicensingMarketService.getAudioFiles(params).pipe(
      share(),
    ).subscribe((response) => {
      console.log("Response");
      console.log(response);
      const { samples, totalItems } = response;
      this.count = totalItems;
      this.sampleLicensingMarketService.samples$.next(samples);
      
    }, (error) => {
      if (error instanceof HttpErrorResponse) {
        if (error.status === 401) {
          this.ls.clear();
          this.jwt.signin();
        }
      }
      console.log(error);
    });
  }

  

  



  ngOnInit() {
    this.searchFilterFormMap.selectionFormMap = new Map<FormControl, Selection>();
    this.searchFilterFormMap.minMaxSliderFormMap = new Map<FormGroup, MinMaxSlider>();


    this.sampleLicensingMarketService.getFilterFormData().subscribe((filterFormMap) => {
      // this.filterFormMap = filterFormMap;
      // const filterForm: FormGroup = this.buildFilterForm()

      this.selectionList = filterFormMap.get('selection') as Array<Selection>;
      this.minMaxList = filterFormMap.get('minMaxSlider') as Array<MinMaxSlider>;

      this.initSearchFilterFormMap(this.selectionList, this.minMaxList);
    });

    this.audioWebService.searchFilterSubject$.pipe(
      // throttle()

      debounceTime(500)
      
      ).subscribe((response) => {

        this.responseReceived = true;
      console.log('Apply')
      const { samples, totalItems } = response;
      this.count = totalItems;
      
      this.sampleLicensingMarketService.samples$.next(samples);
    
    }
    );

    this.audioService.audioState$.pipe(
      takeUntil(this.audioService.audioServiceDestroyed$)
    ).subscribe((state: AudioState) => {
      this.changeDetectorRef.detectChanges();
    });

    this.playStateControlService.playState$.pipe(
      takeUntil(this.playStateControlService.playStateServiceDestroyed$)
    ).subscribe((playState: boolean) => {
      this.playState = playState;
    });

    this.playStateControlService.currentSampleID$.pipe(
      takeUntil(this.playStateControlService.playStateServiceDestroyed$)
    ).subscribe((currentSampleID: string) => {
      this.currentSampleID = currentSampleID;
    });

    // this.sampleLicensingMarketService.getSelectionList().subscribe((selections: Array<Selection>) => {
    //   this.selections = selections;
    // });
    // this.sampleLicensingMarketService.getCategories().subscribe((categoryList: Array<string>) => {
    //   this.categoryList = categoryList;
    //   this.selections.push({
    //     contentList: categoryList,
    //     label: "categories",
    //     placeholder: "categories"
    //   })
    // });

    // this.sampleLicensingMarketService.getGenres().subscribe((genreList: Array<string>) =>{
    //   this.genreList = genreList;
    //   this.selections.push({
    //     contentList: categoryList,
    //     label: "categories",
    //     placeholder: "categories"
    //   })
    // });

    // this.sampleLicensingMarketService.getMoods().subscribe((moodsList: Array<string>) => {
    //   this.moodsList = moodsList;
    // });
    
    // this.genres$ = this.sampleLicensingMarketService.getGenres();
    // this.filterForm = this.buildFilterForm(this.sampleLicensingMarketService.initialFilters);
    this.searchForm = this.sampleLicensingMarketService.buildSearchForm();

  }


  ngAfterViewInit(): void {
    this.loader.open();
  }

  initSearchFilterFormMap(selectionList: Array<Selection>, minMaxSliderList: Array<MinMaxSlider>) {
    this.searchFilterFormMap.selectionFormMap.clear();
    this.searchFilterFormMap.minMaxSliderFormMap.clear();
    selectionList.forEach(selection => {
      this.searchFilterFormMap.selectionFormMap.set(new FormControl(selection.contentList, [Validators.required]), selection);
    });

    minMaxSliderList.forEach((minMaxSlider) => {
      this.searchFilterFormMap.minMaxSliderFormMap.set(this.fb.group({
        'minControl': [minMaxSlider.minValue, []],
        'maxControl': [minMaxSlider.maxValue, []]
      }), minMaxSlider);
    });
  }

  // buildFilterForm(filterData: any = {}) {
  //   this.filterForm = this.fb.group({
  //     // search: [''],
  //     category: ['all'],
  //     genre: ['all'],
  //     minPrice: [filterData.minPrice],
  //     maxPrice: [filterData.maxPrice],
  //     minRating: [filterData.minRating],
  //     maxRating: [filterData.maxRating]
  //   });
  // }

  // public buildFilterForm(filterData: any = {}): FormGroup {
  //   return this.fb.group({
  //     'categories': [this.categoryList, []],
  //     'genres': [this.genreList, []],
  //     'moods': [this.moodsList, []],
  //     'tempo': this.fb.group({
  //       'minTempo': [filterData.minTempo],
  //       'maxTempo': [filterData.maxTempo],
  //     }),
  //     'lep': this.fb.group({
  //       'minLep': [filterData.minLep],
  //       'maxLep': [filterData.maxLep]
  //     }),
  //   });
  // }

  // buildSearchForm() {
  //   this.searchForm = this.fb.group({
  //     search: ['']
  //   });
  // }

  // ngOnDestroy(): void {
  //   this.playStateControlService.emitPlayState(false);
  // }

  // changeGenres(genres) {
  //   if (genres.length === 0) {
  //     this.selectedGenres = this.genreList;
  //   } else {
  //     this.selectedGenres = genres;
  //   }
  // }

  // changeRegions(regions) {
  //   if (regions.length === 0) {
  //     this.selectedRegions = this.regionList;
  //   } else {
  //     this.selectedRegions = regions;

  //   }
  // }

  // changeTrackTypes(trackTypes) {
  //   if (trackTypes.length === 0) {
  //     this.selectedTrackTypes = this.trackTypeList;
  //   } else {
  //     this.selectedTrackTypes = trackTypes;
  //   }
  // }

  // changeSongKeys(songKeys) {
  //   if (songKeys.length === 0) {
  //     this.selectedSongKeys = this.songKeyList;
  //   } else {
  //     this.selectedSongKeys = songKeys;
  //   }
  // }



  

  // setActiveCategory(category) {
  //   this.activeCategory = category;
  //   this.filterForm.controls['category'].setValue(category);
  // }

  // setActiveGenre(genre: string) {
  //   this.activeGenre = genre;
  //   this.filterForm.controls['genre'].setValue(genre);
  // }

  


  initCurrentFile(sampleID: string) {
    // this.playStateControlService.saveIDCurrentPlayElement(sampleID);
    this.playStateControlService.emitCurrentSampleID(sampleID);
  }


  getCurrentTime(): number {
    if (this.audioService.isPlayerReady) {
      // this.changeDetectorRef.markForCheck();
      return this.audioService.getCurrentTime();
    } else {
      return 0;
    }
  }

  getDuration(): number {
    if (this.audioService.isPlayerReady) {
      // this.changeDetectorRef.markForCheck();
      return this.audioService.getDuration();
    } else {
      return 100;
    }
  }

  currentTimeFallback(): number {
    return 0;
  }

  durationFallback(): number {
    return 100;
  }

  onSliderChangeEnd(changeEvent: MatSliderChange) {
    this.audioService.seekTo(changeEvent.source.percent);

  }


  // searchMusicByFormInput(searchString: string) {
  //   this.sampleLicensingMarketService.searchAudioByFormInput(searchString);
  // }

  // searchMusicByFormSubmit(searchString: string) {
  //   if (searchString.length === 0) {
  //     return;
  //   }
  //   this.blurSearchInput();
  //   const sampleIDs: number[] = [];
  //   this.sampleLicensingMarketService.sampleSearchQueries.forEach((query) => {
      
  //     sampleIDs.push(query.id);
  //   });
  //   this.loader.open();
  //   this.sampleLicensingMarketService.searchMusicByFormSubmit(sampleIDs);
  // }


  // searchSingleAudio(sampleID: number) {
  //   this.blurSearchInput();
  //   const sampleIDs: number[] = [];
  //   sampleIDs.push(sampleID);
  //   this.loader.open();
  //   this.sampleLicensingMarketService.searchMusicByFormSubmit(sampleIDs);
  // }


  // blurSearchInput() {
  //   this.searchInput.nativeElement.blur();
  // }

  



  get playState(): boolean {
    return this._playState;
  }

  get currentSampleID(): string {
    return this._currentSampleID;
  }

  set playState(playState: boolean) {
    this._playState = playState;
  }

  set currentSampleID(currentSampleID: string) {
    this._currentSampleID = currentSampleID;
  }
  
  

  public openFilter() {
    this.sampleLicensingMarketService.toggleFilter$.next({ toggleState: true, apply: SidenavContent.Filter });
  }

  handlePageChange(event: number) {
    console.log(event);
    this.page = event;
    this.applyFilter(this.searchFilterFormMap);
    // this.retrieveSamples();
  }
  
  changePage(page: number) {
    this.page = page;
    this.initSearchFilterFormMap(this.selectionList, this.minMaxList);

  }

  changeCount(count: number) {
    this.count = count;
  }

  changeSearchString(searchString: string) {
    this.searchString = searchString;
    // this.applyFilter(this.searchFilterFormMap);
  }

  toggleFilter(isFilterOpen: boolean) {
    this.isFilterOpen = isFilterOpen;
  }

  public toggleSidenav() {
    this.sideNav.opened = !this.sideNav.opened;
  }

  public applyFilter(searchFilterFormMap?: SearchFilterFormMap) {
    if(searchFilterFormMap) {
      this.searchFilterFormMap = searchFilterFormMap;
    }
    const page: Page = {
      sortBy: this.sortBy,
      pageNo: 0,
      pageSize: this.pageSize
    }
    this.responseReceived = false;
    // (this.searchForm.controls['search'] as FormControl).value.title as string
    this.audioWebService.applySearchFilter(this.searchString, this.searchFilterFormMap, page);
    // .pipe(
    //   debounceTime(5000)
    // )
    // .subscribe((response) => {
    //   console.log('Apply')
    //   const { samples, totalItems } = response;
    //   this.count = totalItems;
    //   this.sampleLicensingMarketService.samples$.next(samples);
    // })
    // ;
    
  }


}