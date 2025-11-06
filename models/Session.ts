// models/Session.ts
import { Realm } from '@realm/react';

export class Session extends Realm.Object {
  _id!: Realm.BSON.ObjectId;
  farmerName!: string;
  startTime!: number;
  pauseTimes!: { start: number; end?: number }[];
  endTime!: number;
  totalTime!: number;
  pricePerHour!: string;
  totalCost!: number;
  logs!: { type: string; time: number }[];

  static schema = {
    name: 'Session',
    primaryKey: '_id',
    properties: {
      _id: 'objectId',
      farmerName: 'string',
      startTime: 'int',
      pauseTimes: 'mixed[]', // flexible nested array
      endTime: 'int',
      totalTime: 'int',
      pricePerHour: 'string',
      totalCost: 'double',
      logs: 'mixed[]',
    },
  };
}
