export interface StorageAdapter {
  // Use key to get saved data
  read(key: string): Promise<string | null>;

  // Store data via key
  write(key: string, value: string): Promise<void>;

  // Delete saved data with key
  remove(key: string): Promise<void>;
}
