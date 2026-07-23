export class DataRepository {
  load() {
    throw new Error("DataRepository.load must be implemented");
  }

  save(_state) {
    throw new Error("DataRepository.save must be implemented");
  }

  export(_state) {
    throw new Error("DataRepository.export must be implemented");
  }

  import(_serializedState) {
    throw new Error("DataRepository.import must be implemented");
  }

  getPreference(_name, _fallback) {
    throw new Error("DataRepository.getPreference must be implemented");
  }

  setPreference(_name, _value) {
    throw new Error("DataRepository.setPreference must be implemented");
  }
}
