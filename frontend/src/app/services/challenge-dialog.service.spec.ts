import { TestBed } from '@angular/core/testing';

import { ChallengeDialogService } from './challenge-dialog.service';

describe('ChallengeDialogService', () => {
  let service: ChallengeDialogService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChallengeDialogService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
