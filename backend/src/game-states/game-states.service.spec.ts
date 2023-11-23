import { Test, TestingModule } from '@nestjs/testing';
import { GameStatesService } from './game-states.service';

describe('GameStatesService', () => {
  let service: GameStatesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GameStatesService],
    }).compile();

    service = module.get<GameStatesService>(GameStatesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
