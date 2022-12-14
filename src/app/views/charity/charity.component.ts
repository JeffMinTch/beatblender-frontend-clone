import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-charity',
  templateUrl: './charity.component.html',
  styleUrls: ['./charity.component.scss']
})
export class CharityComponent implements OnInit {

  checked = false;
  indeterminate = false;
  labelPosition: 'one' | 'two' | 'three' = 'one';
  disabled = false;

  constructor() { }

  ngOnInit(): void {
  }

}
