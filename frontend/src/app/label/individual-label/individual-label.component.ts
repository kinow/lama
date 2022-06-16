/**
 * Author: Victoria Bogachenkova
 * Author: Bartjan Henkemans
 */
import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { LabellingDataService } from 'app/services/labelling-data.service';
import { Router } from '@angular/router';
import { ReroutingService } from 'app/services/rerouting.service';
import { Label } from 'app/classes/label';
import { Theme } from 'app/classes/theme';
import { LabelFormComponent } from 'app/modals/label-form/label-form.component';

@Component({
  selector: 'app-individual-label',
  templateUrl: './individual-label.component.html',
  styleUrls: ['./individual-label.component.scss'],
})
export class IndividualLabelComponent {
  routeService: ReroutingService;
  label: Label;
  url: string;
  labellings: Array<any>;
  themes: Array<Theme>;
  p_id: number;
  label_id: number;

  /**
   * Constructor which:
   * 1. makes an empty label
   * 2. get routerService
   * 3. get url
   * 4. initialize labellings variable
   */
  constructor(
    private modalService: NgbModal,
    private router: Router,
    private labellingDataService: LabellingDataService
  ) {
    this.label = new Label(-1, '', '', '');
    this.routeService = new ReroutingService();
    this.url = this.router.url;
    this.labellings = new Array<any>();
    this.themes = new Array<Theme>();
    this.p_id = parseInt(this.routeService.getProjectID(this.url));
    this.label_id = parseInt(this.routeService.getLabelID(this.url));
  }

  /**
   * OnInit,
   *  1. the p_id of the project is retrieved
   *  2. the labelId of the label is retrieved
   *  3. the label loading is started
   */
  ngOnInit(): void {
    this.getLabel(this.p_id, this.label_id);
    this.getLabellings(this.p_id, this.label_id);
  }

  /**
   * Async function which gets the label
   */
  async getLabel(p_id: number, labelID: number): Promise<void> {
    try {
      const label = await this.labellingDataService.getLabel(p_id, labelID);
      this.label = label;
    } catch (e) {
      this.router.navigate(['project', this.p_id]);
    }
    try {
      const themes = this.label.getThemes();
      if (themes !== undefined) {
        this.themes = themes;
      }
    } catch (e) {
      this.router.navigate(['project', this.p_id]);
    }
  }

  async getLabellings(p_id: number, labelID: number): Promise<void> {
    try {
      const labellings = await this.labellingDataService.getLabelling(
        p_id,
        labelID
      );
      this.labellings = labellings;
    } catch (edit) {
      this.router.navigate(['project', this.p_id]);
    }
  }

  async postSoftDelete() {
    try{
      await this.labellingDataService.postSoftDelete({
        'p_id': this.p_id,
        'l_id': this.label_id
      });
      this.router.navigate(['project', this.p_id, 'labelmanagement']);
    } catch (e) {
      console.log("Something went wrong!")
      this.router.navigate(['project', this.p_id]);
    }
  }

  /**
   * Gets the project id from the URL and reroutes to the label management page
   * of the same project
   *
   * @trigger back button is pressed
   */
  reRouter(): void {
    // Changes the route accordingly
    this.router.navigate(['/project', this.p_id, 'labelmanagement']);
  }

  /**
   * Opens modal to edit label
   */
  openEdit() {
    const modalRef = this.modalService.open(LabelFormComponent, { size: 'xl' });
    modalRef.componentInstance.label = this.label;
    modalRef.result.then(() => {
      this.ngOnInit();
    });
  }
}
