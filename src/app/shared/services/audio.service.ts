import { Injectable, ViewChild, ElementRef, Renderer2, RendererFactory2, ChangeDetectorRef } from '@angular/core';
import { Subject, Observable, BehaviorSubject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import * as moment from "moment";
import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';
import { PlayStateControlService } from './play-state-control.service';
import {Sample} from '../models/sample.model';
import { CurrentFile } from '../models/current-file.model';
// import { FileUploadService } from './file-upload.service';
import WaveSurfer from 'wavesurfer.js/dist/wavesurfer.js';
import CursorPlugin from 'wavesurfer.js/dist/plugin/wavesurfer.cursor.js';
import TimelinePlugin from 'wavesurfer.js/dist/plugin/wavesurfer.timeline.js';
import { AudioState } from '../models/audio-state.model';
import { ComponentCommunicationService } from './component-communication.service';

@Injectable({
  providedIn: 'root'
})
export class AudioService {

  private subjectAudioFile = new Subject<Array<any>>();
  audioFileEmitted$ = this.subjectAudioFile.asObservable();
  audioFileSubscription: Subscription;


  constructor(
    private compComService: ComponentCommunicationService, 
    private playStateControlService: PlayStateControlService,
    // public changeDetectorRef: ChangeDetectorRef
    ) {
    this.audioFileSubscription = this.audioFileEmitted$.subscribe(audioContainerArray => {
      let file = audioContainerArray[0];
      let index = audioContainerArray[1];
      const currentFile = this.playStateControlService.getCurrentFile();
      if (currentFile.index === audioContainerArray[1]) {
        this.play();
      } else {
        this.playStateControlService.updateCurrentFile(file, index);
        // this.wavesurfer.destroy();
        // this.createWavesurferObj();
        this.loadPlayAudio(audioContainerArray[0].userName, audioContainerArray[0].url);
      }
    });
  }

  
  wavesurfer;
  primaryColor: string = window.getComputedStyle(document.documentElement).getPropertyValue('--primary');
  whiteColor: string = window.getComputedStyle(document.documentElement).getPropertyValue('--white');
  whiteSuperColor: string = window.getComputedStyle(document.documentElement).getPropertyValue('--white-super');
  
  themeColor: string = window.getComputedStyle(document.documentElement).getPropertyValue('--theme');
  themeLightColor: string = window.getComputedStyle(document.documentElement).getPropertyValue('--theme-super');
  themeDarkColor: string = window.getComputedStyle(document.documentElement).getPropertyValue('--theme-dark');
  accentColor: string = window.getComputedStyle(document.documentElement).getPropertyValue('--accent');


  onReadylistener;
  counter:number=0;
  public audioState = new Subject<any>();
  audioState$ = this.audioState.asObservable();
  emitAudioState(state: AudioState) {
    this.audioState.next(state);
  }


  play() {
    this.wavesurfer.play();
  }

  pause() {
    this.wavesurfer.pause();
  }

  createWavesurferObj() {
    // this.wavesurfer = null;
    this.wavesurfer = WaveSurfer.create({
      container: '#waveform',
      barWidth: 4,
      // barRadius: 3,
      hideScrollbar: true,
      cursorWidth: 1,
      // scrollParent: true,
      barGap: 3,
      barHeight: 1,
      // // container: '#waveform',
      backend: 'WebAudio',
      height: 40,
      fillParent: true,
      // backgroundColor: this.themeLightColor,
      // // progressColor: '#03a9f4',
      progressColor: 'yellow',
      responsive: true,
      // waveColor: 'transparent',
      waveColor: 'whitesmoke',
      // zoom: 50,
      // cursorColor: '#efefef',
      cursorColor: 'transparent',
      plugins: [
        // TimelinePlugin.create({
        //   // plugin options ...
        //   container: '#timeline',
        //   unlabeledNotchColor: this.whiteColor,
        //   primaryColor: '#03a9f4',
        //   secondaryColor: this.primaryColor,
        //   secondaryFontColor: this.whiteColor,
        //   // timeInterval: 0.5
        // }),
        CursorPlugin.create({
          // plugin options ...
          color: '#efefef',
          showTime: true,
          style: 'dashed',
          followCursorY: true
        })

      ]
    });

    this.wavesurfer.on('finish', () => {
      console.log('AudioTrack FInished');
      this.wavesurfer.setCurrentTime(0);
      this.playStateControlService.savePlayState(false);
      // this.changeDetectorRef.markForCheck()
      this.emitAudioState({
        status: "finish",
        currentTime: 0,
        duration: 0
      });
    });
    this.wavesurfer.on("audioprocess", (mycurrentTime: number) => {
    this.counter++;   
      if(this.counter === 10) {

        this.emitAudioState({
          status: "playing",
          currentTime: mycurrentTime,
          duration: this.wavesurfer.getDuration() as number
        });
        this.counter=0;
      }

    });
    this.wavesurfer.on("ready", () => {
      this.compComService.emitAudioLoaded();
      if(this.playStateControlService.getPlayState()) {

        this.play();
      }
      
    });

  }

  getTrackLength():Observable<number> {
   return this.wavesurfer.getDuration();
  }
  

  loadAudio(userName, url) {
   let load =  this.wavesurfer.load(`http://localhost:8080/api/samplepool/downloadFile/${userName}/${url}`); 
  }

  toggleMute() {
    this.wavesurfer.toggleMute();
  }

  getMute() {
    return this.wavesurfer.getMute();
  }

  loadPlayAudio(userName, url) {    
    this.wavesurfer.load(`http://localhost:8080/api/samplepool/downloadFile/${userName}/${url}`); 
  }

  seekTo(percent: number) {
    this.wavesurfer.seekTo(percent);
  }

  getDuration() {
    return this.wavesurfer.getDuration();
  }

  toggle = false;
  setWaveColor(color: string) {
    if(this.toggle) {
      this.wavesurfer.setProgressColor(this.primaryColor);
      this.toggle = !this.toggle;
    } else {
      this.wavesurfer.setProgressColor(color);
      this.toggle= !this.toggle;

    }
  }



  private audioStateViewUpdate = new Subject<any>();
  audioStateViewUpdateEmitted$ = this.audioStateViewUpdate.asObservable();
  emitAudioStateUpdate(currentFile: CurrentFile) {
    this.audioStateViewUpdate.next(event);
  }
  


  


  private subjectPausePressed = new Subject<any>();
  subjectPausePressedEmitted$ = this.subjectPausePressed.asObservable();
  emitPausePressed() {
    this.subjectPausePressed.next();
  }

  emitAudioFile(audioFile: Sample, index: number) {
    let audioContainerArray: Array<any> = [];
    audioContainerArray.push(audioFile);
    audioContainerArray.push(index);
    this.subjectAudioFile.next(audioContainerArray);
  }

  
}


