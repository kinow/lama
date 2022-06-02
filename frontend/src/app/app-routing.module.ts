import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CommonModule } from '@angular/common';

import { TestingComponent } from './testing/testing.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { AccountComponent } from './account/account.component';
import { HomePageComponent } from './home-page/home-page.component';
import { ProjectCreationComponent } from './project-creation/project-creation.component';
import { ConflictPageComponent } from './conflict-page/conflict-page.component';
import { ConflictResolutionComponent } from './conflict-resolution/conflict-resolution.component';
import { ProjectComponent} from './project/project.component';
import { NavigationMenuComponent } from './navigation-menu/navigation-menu.component';
import { StatsComponent } from './stats/stats.component';
import { LabellingPageComponent } from './labelling-page/labelling-page.component';
import { LabelFormComponent } from './label-form/label-form.component';
import { ArtifactManagementPageComponent } from './artifact-management-page/artifact-management-page.component';
import { SingleArtifactViewComponent } from './single-artifact-view/single-artifact-view.component';
import { LabelManagementComponent } from './label-management/label-management.component';
import { IndividualLabelComponent } from './individual-label/individual-label.component';


/* All the routes within the application */
const routes: Routes = [
    {path: '', redirectTo: 'login', pathMatch: 'full'},
    {path: 'login', component: LoginComponent},
    {path: 'register', component: RegisterComponent},
    {path: 'testing', component: TestingComponent},
    {path: 'account', component: AccountComponent},
    {path: 'home', component: HomePageComponent},
    {path: 'createProject', component:ProjectCreationComponent},
    {path: 'project', component: ProjectComponent, children: [
      {path: '', redirectTo: 'stats', pathMatch: 'full'},
      {path: 'stats', component: StatsComponent},
      {path: 'conflict', component: ConflictPageComponent},
      {path: 'conflictResolution', component: ConflictResolutionComponent},
      {path: '', outlet: 'side-nav', component: NavigationMenuComponent}
    ]},
    {path: 'labelling-page', component:LabellingPageComponent},
    {path: 'create-label', component:LabelFormComponent},
    {path: 'artifactmanagement', component:ArtifactManagementPageComponent},
    {path: 'singleartifact', component:SingleArtifactViewComponent},
    {path: 'labelmanagement', component:LabelManagementComponent},
    {path: 'singlelabel', component:IndividualLabelComponent},
    {path: '**', redirectTo: 'login', pathMatch: 'full'}];
    
@NgModule({
  imports: [CommonModule, RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
