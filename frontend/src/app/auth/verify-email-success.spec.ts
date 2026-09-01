import { TestBed } from '@angular/core/testing';
import { VerifyEmailSuccess } from './verify-email-success';

describe('VerifyEmailSuccess', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerifyEmailSuccess],
    }).compileComponents();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(VerifyEmailSuccess);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should state the email was verified and awaits approval', () => {
    const fixture = TestBed.createComponent(VerifyEmailSuccess);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Email verified');
    expect(compiled.textContent).toContain('waiting for administrator approval');
    expect(compiled.textContent).toContain('access the application');
  });
});
