import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { Theme } from 'app/classes/theme';
import { ThemeManagementComponent } from './theme-management.component';

describe('ThemeManagementComponent', () => {
  let component: ThemeManagementComponent;
  let fixture: ComponentFixture<ThemeManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ThemeManagementComponent ],
      // Adding the RouterTestingModule dependency
      imports: [RouterTestingModule, ReactiveFormsModule],
      providers: [FormBuilder]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ThemeManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // Checks whether the component is created successfully
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize', async () => {
    // Creates the spies
    let spy = spyOn(component["projectDataService"], "getFrozen");
    let spy2 = spyOn(component, "getThemes");
    let spy3 = spyOn(component, "searchClick");

    // Calls the function to be tested
    await component.ngOnInit();

    // Checks the function calls
    expect(spy).toHaveBeenCalled();
    expect(spy2).toHaveBeenCalled();
    expect(spy3).toHaveBeenCalled();
  });

  it('should start the search', async () => {
    let spy = spyOn(component, "onEnter");

    // Calls the function to be tested
    component.searchClick();

    // Calls the click on the search icon
    let image = document.getElementById("searchBar");
    // @ts-ignore: Given type error, but works fine
    spyOn(image, "getBoundingClientRect").and.returnValue({left: -1000});
    image?.click();

    // Checks the result
    expect(spy).toHaveBeenCalled();
  });

  it('should reroute the user to a new page', async () => {
    // creates router spy
    let spyRouter = spyOn(component["router"], "navigate");
    component.p_id = 5;

    // Calls the function to be tested
    component.reRouter("somewhere");

    // Checks the result
    expect(spyRouter).toHaveBeenCalledWith(['/project', 5, "somewhere"]);
  });

  it('should reroute the user to theme', async () => {
    // creates router spy
    let spyRouter = spyOn(component["router"], "navigate");
    component.p_id = 5;

    // Calls the function to be tested
    component.reRouterTheme("somewhere", 8);

    // Checks the result
    expect(spyRouter).toHaveBeenCalledWith(['/project', 5, "somewhere", 8]);
  });

  it('should get the themes', async () => {
    // Create dummy data
    let t1 = new Theme(1, "theme1", "desc1");
    let t2 = new Theme(2, "theme2", "desc2");

    // creates spy for backend call 
    let spy = spyOn(component["themeDataService"], "getThemes").and.returnValue(Promise.resolve([t1, t2]));
    
    // Calls the function to be tested
    await component.getThemes();

    // Checks the results
    expect(spy).toHaveBeenCalled();
    expect(component.themes).toEqual([t1, t2]);
  });

  it('should sort themes based on name desc', async () => {
    // Create dummy data
    let t1 = new Theme(1, "theme1", "desc1");
    let t2 = new Theme(2, "theme2", "desc2");
    let t3 = new Theme(3, "theme3", "desc3");

    component.sortedName = 1;
    component.themes = [t2, t1, t3];
    
    // Calls the function to be tested
    component.sortName();

    // Checks the results
    expect(component.themes).toEqual([t3, t2, t1]);
    expect(component.sortedName).toBe(2);
  });

  it('should sort themes based on name asc', async () => {
    // Create dummy data
    let t1 = new Theme(1, "theme1", "desc1");
    let t2 = new Theme(2, "theme2", "desc2");
    let t3 = new Theme(3, "theme3", "desc3");

    component.sortedName = 2;
    component.themes = [t2, t1, t3];
    
    // Calls the function to be tested
    component.sortName();

    // Checks the results
    expect(component.themes).toEqual([t1, t2, t3]);
    expect(component.sortedName).toBe(1);
  });

  it('should sort themes based on name (not sorted)', async () => {
    // Create dummy data
    let t1 = new Theme(1, "theme1", "desc1");
    let t2 = new Theme(2, "theme2", "desc2");
    let t3 = new Theme(3, "theme3", "desc3");

    component.sortedName = 0;
    component.themes = [t2, t1, t3];
    
    // Calls the function to be tested
    component.sortName();

    // Checks the results
    expect(component.themes).toEqual([t1, t2, t3]);
    expect(component.sortedName).toBe(1);
  });

  it('should sort themes based on description desc', async () => {
    // Create dummy data
    let t1 = new Theme(1, "theme1", "desc1");
    let t2 = new Theme(2, "theme2", "desc2");
    let t3 = new Theme(3, "theme3", "desc3");

    component.sortedDesc = 1;
    component.themes = [t2, t1, t3];
    
    // Calls the function to be tested
    component.sortDesc();

    // Checks the results
    expect(component.themes).toEqual([t3, t2, t1]);
    expect(component.sortedDesc).toBe(2);
  });

  it('should sort themes based on description asc', async () => {
    // Create dummy data
    let t1 = new Theme(1, "theme1", "desc1");
    let t2 = new Theme(2, "theme2", "desc2");
    let t3 = new Theme(3, "theme3", "desc3");

    component.sortedDesc = 2;
    component.themes = [t2, t1, t3];
    
    // Calls the function to be tested
    component.sortDesc();

    // Checks the results
    expect(component.themes).toEqual([t1, t2, t3]);
    expect(component.sortedDesc).toBe(1);
  });

  it('should sort themes based on description (not sorted)', async () => {
    // Create dummy data
    let t1 = new Theme(1, "theme1", "desc1");
    let t2 = new Theme(2, "theme2", "desc2");
    let t3 = new Theme(3, "theme3", "desc3");

    component.sortedDesc = 0;
    component.themes = [t2, t1, t3];
    
    // Calls the function to be tested
    component.sortDesc();

    // Checks the results
    expect(component.themes).toEqual([t1, t2, t3]);
    expect(component.sortedDesc).toBe(1);
  });

  it('should sort themes based on # of labels desc', async () => {
    // Create dummy data
    let t1 = new Theme(1, "theme1", "desc1");
    t1.setNumberOfLabels(1);
    let t2 = new Theme(2, "theme2", "desc2");
    t2.setNumberOfLabels(2);
    let t3 = new Theme(3, "theme3", "desc3");
    t3.setNumberOfLabels(3);

    component.sortedNOL = 1;
    component.themes = [t2, t1, t3];
    
    // Calls the function to be tested
    component.sortLabels();

    // Checks the results
    expect(component.themes).toEqual([t1, t2, t3]);
    expect(component.sortedNOL).toBe(2);
  });

  it('should sort themes based on # of labels asc', async () => {
    // Create dummy data
    let t1 = new Theme(1, "theme1", "desc1");
    t1.setNumberOfLabels(1);
    let t2 = new Theme(2, "theme2", "desc2");
    t2.setNumberOfLabels(2);
    let t3 = new Theme(3, "theme3", "desc3");
    t3.setNumberOfLabels(3);

    component.sortedNOL = 2;
    component.themes = [t2, t1, t3];
    
    // Calls the function to be tested
    component.sortLabels();

    // Checks the results
    expect(component.themes).toEqual([t3, t2, t1]);
    expect(component.sortedNOL).toBe(1);
  });

  it('should sort themes based on # of labels (not sorted)', async () => {
    // Create dummy data
    let t1 = new Theme(1, "theme1", "desc1");
    t1.setNumberOfLabels(1);
    let t2 = new Theme(2, "theme2", "desc2");
    t2.setNumberOfLabels(2);
    let t3 = new Theme(3, "theme3", "desc3");
    t3.setNumberOfLabels(3);

    component.sortedNOL = 0;
    component.themes = [t2, t1, t3];
    
    // Calls the function to be tested
    component.sortLabels();

    // Checks the results
    expect(component.themes).toEqual([t3, t2, t1]);
    expect(component.sortedNOL).toBe(1);
  });

  it('should get the search text and search through the themes', async () => {
    // Creates the spies and sets initial values
    spyOn(component["routeService"], "getProjectID").and.returnValue("5");
    component.searchForm.controls["search_term"].setValue("");
    let spy = spyOn(component, "getThemes");

    // Calls the function to be tested
    component.onEnter();

    // Checks the results
    expect(spy).toHaveBeenCalled();
  });

  it('should get the search text and search through the themes', async () => {
    // Create dummy data
    let t1 = new Theme(1, "theme1", "desc1");
    let t2 = new Theme(2, "theme2", "desc2");
    component.searchForm.controls["search_term"].setValue("something");

    // creates some spies on the service calls
    spyOn(component["routeService"], "getProjectID").and.returnValue("5");
    let spy = spyOn(component["themeDataService"], "search").and.returnValue(Promise.resolve(
      [
        {
          "id": 1,
          "name": "theme1",
          "description": "desc1"
        },
        {
          "id": 2,
          "name": "theme2",
          "description": "desc2"
        },
      ]
    ));

    // Calls the function to be tested
    await component.onEnter();

    // Checks the results
    expect(spy).toHaveBeenCalled();
    expect(component.themes).toEqual([t1, t2]);
  });

});
