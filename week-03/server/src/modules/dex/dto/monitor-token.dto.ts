export class StartMonitoringDto {
  tokens: string[];
  pollingInterval?: number;
}

export class StopMonitoringDto {
  tokens?: string[];
}
