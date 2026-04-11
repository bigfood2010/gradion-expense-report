export abstract class ExtractionDispatcherRepository {
  abstract dispatch(itemId: string): Promise<void>;
}
