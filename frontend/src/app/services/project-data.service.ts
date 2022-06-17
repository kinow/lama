// Victoria Bogachenkova
import { Injectable } from '@angular/core';
import { Project } from 'app/classes/project';

import { RequestHandler } from 'app/classes/RequestHandler';

@Injectable({
  providedIn: 'root'
})
export class ProjectDataService {
  private requestHandler: RequestHandler;
  private sessionToken: string | null;

  /**
   * Constructor instantiates requestHandler
   */
  constructor() {
    this.sessionToken = sessionStorage.getItem('ses_token');
    this.requestHandler = new RequestHandler(this.sessionToken);
  }

  /**
   * Function which makes the request to the backend for all project of which the user is a member
   * Religates the parsing of the response to a different function. 
   * (uses requesthandler for communication with the backend)
   * 
   * @trigger on component creation
   * @modifies projects
   */
   async getProjects() : Promise<Array<Project>> {

    // Makes the backend request to get the projects of which the user is a member
    let response: any = await this.requestHandler.get("/project/home", {}, true);

    // Array with results
    let result: Array<Project> = new Array<Project>();

    // For each project in the list
    response.forEach((project: any) =>{
      // Initialize a new project with all values
      let projectJson = project["project"];
      projectJson["numberOfArtifacts"] = project["projectNrArtifacts"];
      projectJson["numberOfCLArtifacts"] = project["projectNrCLArtifacts"];
      projectJson["users"] = project["projectUsers"];
      projectJson["admin"] = project["projectAdmin"];

      // Create the project with constructor
      let projectNew = new Project(projectJson["id"], projectJson["name"], projectJson["description"]);
      
      // Set other variables
      projectNew.setFrozen(projectJson["frozen"]);
      projectNew.setNumberOfArtifacts(projectJson["numberOfArtifacts"]);
      projectNew.setNumberOfCLArtifacts(projectJson["numberOfCLArtifacts"]);
      projectNew.setAdmin(projectJson["admin"]);
      projectNew.setUsers(projectJson["users"]);

      // Add project to list
      result.push(projectNew);
    });

    // Return result
    return result;
  }

}