/**
 * @author B. Henkemans
 * @author T. Bradley
 * @author Jarl Jansen
 */
import { Component, EventEmitter, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { LabelFormComponent } from 'app/modals/label-form/label-form.component';
import { LabellingDataService } from 'app/services/labelling-data.service';
import { StringArtifact } from 'app/classes/stringartifact';
import { LabelType } from 'app/classes/label-type';
import { ArtifactDataService } from 'app/services/artifact-data.service';
import { Router } from '@angular/router';
import { ReroutingService } from 'app/services/rerouting.service';
import { FormArray, FormGroup } from '@angular/forms';
import { ToastCommService } from 'app/services/toast-comm.service';
import { AccountInfoService } from 'app/services/account-info.service';

@Component({
  selector: 'app-labelling-page',
  templateUrl: './labelling-page.component.html',
  styleUrls: ['./labelling-page.component.scss'],
})
export class LabellingPageComponent implements OnInit {
  /**
   * Information for the screen
   */
  artifact: StringArtifact;
  labelTypes: Array<LabelType>;
  labellers: Array<any>;

  /**
   * Forms for the labelling
   */
  labellings: FormArray;
  form: FormGroup;
  eventEmitter: EventEmitter<any>;

  /**
   * Information concerning the highlighting and cutting
   */
  hightlightedText: string = '';
  selectionStartChar?: number;
  selectionEndChar?: number;

  /**
   * Routing
   */
  routeService: ReroutingService;
  url: string;
  p_id: number;

  /**
   * Start and end timestamps
   */
  startTime: any;
  endTime: any;

  /**
   * Constructor passes in the modal service and the labelling data service
   * @param modalService
   * @param labellingDataService
   */
  constructor(
    private modalService: NgbModal,
    private labellingDataService: LabellingDataService,
    private artifactDataService: ArtifactDataService,
    private router: Router,
    private toastCommService: ToastCommService
  ) {
    /**
     * Preparing variables for information
     */
    this.artifact = new StringArtifact(-1, 'null', 'null');
    this.labellers = new Array();
    this.labelTypes = new Array<LabelType>();

    /**
     * Setting up forms
     */
    this.labellings = new FormArray([]);
    this.form = new FormGroup({
      labellings: this.labellings,
    });
    this.eventEmitter = new EventEmitter<any>();
    /**
     * Setting up routing
     */
    this.routeService = new ReroutingService();
    this.url = this.router.url;
    this.p_id = parseInt(this.routeService.getProjectID(this.url));
  }

  async ngOnInit(): Promise<void> {
    /**
     * Getting information from the backend
     * This page has a couple of preconditions. These are checked at various points
     * in the initialization process. Namely:
     * 1. An artifact is loaded
     * 2. The labellers is loaded
     * 3. The labels and their types are loaded.
     * If any of this fails the user is redirected back to the stats page.
     */

    // Gets the url again
    this.url = this.router.url;

    this.labellings = new FormArray([]);
    this.eventEmitter.emit();

    // Loads the page content
    await this.loadPageContent();    

    // Get the timestamp when this component is opened
    this.startTime = Date.now();
  }

  async loadPageContent() {
    // Checks whether a labelling ID is provided
    if(this.routeService.checkLabellingId(this.url)) {
      // Shows labelling page of a specific artifact
      await this.getNonRandomArtifact(parseInt(this.routeService.getThemeID(this.url)));
    } else {
      // Shows labelling page of a random artifact
      await this.getRandomArtifact();
    }
    // Requests the label types and the corresponding labels
    await this.getLabelTypesWithLabels();

    // Initialize accountInfoService
    let accountService = new AccountInfoService();
    // Gets user data
    let user = await accountService.userData();

    // Checks whether this user has already labelled the artifact, if so redirects to artifact management page
    this.labellers.forEach(labeller => {
      if (labeller["id"]==user["id"]) {
        this.router.navigate(['/project', this.p_id, 'singleartifact', this.routeService.getThemeID(this.url)]);
        this.toastCommService.emitChange([false, "You have already labelled this artifact"]);
      }
    });
  }

  /**
   * Loads a specific artifact into the labelling page
   * @param artID id of the artifact
   */
  async getNonRandomArtifact(artID: number): Promise<void> {
    try {
      // Gets the artifact data
      let result = await this.artifactDataService.getArtifact(this.p_id, artID);
      this.artifact = result["result"];
    } catch {
      // If an error occurs reroute to the stats page
      this.router.navigate(['/project', this.p_id]);
      this.toastCommService.emitChange([false, "Invalid request"]);
    }
    // Gets the people who have labelled the artifact already
    await this.getLabellersGen();
  }

  /**
   * Gets a random artifact from project p_id
   * 1. Awaits response from the backend
   * 2. Puts artifact in the right variable
   * 3. Only then gets the labellers
   * 4. Awaits response
   * 5. Puts labellers into variable
   * @param p_id
   */
  async getRandomArtifact(): Promise<void> {
    try {
      const artifact = await this.artifactDataService.getRandomArtifact(
        this.p_id
      );
      this.artifact = artifact;
    } catch {
      if (this.artifact.getId() === -1) {
        this.router.navigate(['/project', this.p_id]);
        this.toastCommService.emitChange([false, "There are no artifacts to label."]);
      } else{
        this.router.navigate(['/project', this.p_id]);
        this.toastCommService.emitChange([false, "There are no artifacts left to label!"]);
      }
    }

    await this.getLabellersGen();
  }

  /**
   * Makes the request for all people who have already labelled an artifact
   * @modifies this.labellers
   */
  async getLabellersGen(): Promise<void> {
    // Makes the request
    try {
      const labellers = await this.artifactDataService.getLabellers(
        this.p_id,
        this.artifact.getId()
      );
      this.labellers = labellers;
    } catch {
      // If an error occurs redirects to the stats page
      this.router.navigate(['/project', this.p_id]);
      this.toastCommService.emitChange([false, "Something went wrong. Please try again!"]);
    }
  }

  /**
   * Function for getting the label and labeltypes
   * @param p_id
   */
  async getLabelTypesWithLabels(): Promise<void> {
    try {
      const labelTypes =
        await this.labellingDataService.getLabelTypesWithLabels(this.p_id);
      this.labelTypes = labelTypes;
    } catch {
      this.router.navigate(['/project', this.p_id]);
    }
  }

  /**
   * Opens modal which contains the create LabelFormComponent.
   */
  openCreateForm(): void {
    let modal = this.modalService.open(LabelFormComponent, { size: 'xl' });
    modal.result.then((data) => {
      this.getLabelTypesWithLabels();
    });
  }

  /**
   * Skip to another random artifact 
   * (if on the labelling page of a specific artifact, redirects to general labelling page)
   */
  skip(): void {
    if(this.routeService.checkLabellingId(this.url)) {
      this.router.navigate(['/project', this.p_id, 'labelling-page']);
    } else {
      this.ngOnInit();
    }
  }

  /**
   * Gets the project id from the URL and reroutes to the single label page
   * of the same project
   *
   * @trigger click on label
   */
  reRouter(): void {
    // Changes the route accordingly
    this.router.navigate(['/project', this.p_id, 'labelling-page']);
  }

  /**
   *Submit the labelling
   * 1. Get the time now
   * 2. Count the total time
   * 3. Create a reponse
   * 4. Create a dictionary
   * 5. Put reponse in dictionary and send it
   * 6. Otherwise catch the message
   */
  submit(): void {
    // Get the timestamp when the labels are submitted
    this.endTime = Date.now();
    // Number of seconds the labellings took
    let totalTime = (this.endTime - this.startTime) / 1000;
    try {
      let resultArray: Array<Object> = this.createResponse(totalTime);
      const dict = {
        p_id: this.p_id,
        resultArray: resultArray,
      };
      this.sendSubmission(dict);
      this.toastCommService.emitChange([true, "Artifact labelled successfully"]);
    } catch (e) {
      this.toastCommService.emitChange([false, "Submission invalid"]);
    }
  }

  /**
   * Create response 
   * @param totalTime 
   * @returns response from creating a labelling 
   */
  createResponse(totalTime: number): Array<Object> {
    // Create an array
    let resultArray: Array<Object> = Array<Object>();
    this.labellings.controls.forEach((el: any) => {
      // Check the labelling is valid
      if (el.status != 'VALID') {
        // Throw and error
        throw 'Submission invalid';
      }
      // Push valid results into result array
      resultArray.push({
        a_id: this.artifact?.getId(),
        label_type: {
          id: el.get('labelType')?.value.getId(),
          name: el.get('labelType')?.value.getName()
        },
        label: {
          id: el.get('label')?.value.getId(),
          name: el.get('label')?.value.getName()
        },
        remark: el.get('remark')?.value,
        time: totalTime,
      });
    });
    // Return results
    return resultArray;
  }

  /**
   * Send the submission to the backend
   * @param dict - dictionary
   */
  async sendSubmission(dict: Object): Promise<void> {
    try {
      // Wait for the submission
      await this.labellingDataService.postLabelling(dict);
      // Reinitialise the page
      this.ngOnInit();
    } catch (err) {
      // Send error
      this.toastCommService.emitChange([false, "Database error while submitting labelling."]);
    }
  }

  /**
   * Error function for unimplemented features.
   */
  notImplemented(): void {
    throw new Error('This function has not been implemented yet.');
  }

  /**
   * Function is ran on mouseDown or mouseUp and updates the current selection
   * of the artifact. If the selection is null or empty, the selection is set
   * to ""
   */
  selectedText(): void {
    let hightlightedText: Selection | null = document.getSelection();
    //gets the start and end indices of the highlighted bit
    let startCharacter: number = hightlightedText?.anchorOffset!;
    let endCharacter: number = hightlightedText?.focusOffset!;
    //make sure they in the right order
    if (startCharacter > endCharacter) {
      startCharacter = hightlightedText?.focusOffset!;
      endCharacter = hightlightedText?.anchorOffset!;
    }
    //put into global variable
    this.selectionStartChar = startCharacter;
    this.selectionEndChar = endCharacter;
    //this is so the buttons still pop up, idk if we need it so ill ask bartgang
    if (hightlightedText == null || hightlightedText.toString().length <= 0) {
      this.hightlightedText = '';
    } else {
      this.hightlightedText = hightlightedText.toString();
    }
  }

  /**
   * Splitting function, gets text without splitting words and gets start and end char
   */
  async split(): Promise<void> {
    // Get start/end positions of highlight
    let firstCharacter = this.selectionStartChar! - 1;
    let lastCharacter = this.selectionEndChar! - 1;
    // Fix positions to start/end of words that they clip
    firstCharacter = this.startPosFixer(firstCharacter);
    lastCharacter = this.endPosFixer(lastCharacter);
    // Get the text represented by the rounded start and end
    let splitText = this.artifact?.data.substring(
      firstCharacter,
      lastCharacter
    );
    // Make request to split
    await this.artifactDataService.postSplit(this.p_id, this.artifact.getId(), this.artifact.getIdentifier(), firstCharacter, lastCharacter, splitText);
    this.toastCommService.emitChange([true, "Artifact successfully split!\n Text selected: '" + splitText+ "'"]);

    // Reloads the page
    this.ngOnInit();
  }

  async routeToLabel(item: number | undefined) : Promise<void> {
    await this.router.navigate(['/project', this.p_id, 'labelling-page', item]);
    await this.ngOnInit();
  }

  //fixes the position of the start character of a word
  startPosFixer(startPos: number) {
    //gets char at start of the word
    let chart = this.artifact?.data.charAt(startPos);
    //checks if it is at the correct position to begin with
    if (chart == ' ' ) {
      startPos = startPos + 1
      return startPos
    }
    //start bound check
    if (startPos == 0) {
      return startPos
    }

    //else, move until we find the start of a word
    while (chart != ' ' && startPos > 0) {
      chart = this.artifact?.data.charAt(startPos);
      startPos--;
    }

    //last adjustmensts for when the text goes too far
    if (startPos != 0) {
      startPos++;
    }
    return startPos
  }

  //fixes the position of the start character of a word
  endPosFixer(endPos: number) {
    //gets char at end of the word
    let chend = this.artifact?.data.charAt(endPos);
    //see if the last char is correct to begin with
    if (chend == ' ' || endPos == this.artifact.data.length) {
      return endPos
    }
    //fix such that the next word is not accidentally selected
    if (this.artifact?.data.charAt(endPos - 1) == ' ') {
      endPos--
      return endPos
    }
    //else, move until we find a space or hit the end of artifact
    while (chend != ' ' && endPos < this.artifact?.data.length) {
      chend = this.artifact?.data.charAt(endPos);
      endPos++;
    }

    return endPos
  }
}