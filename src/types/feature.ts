// One entry in the backend's dynamic feature registry (feature_registry).
// Plans may only sell services whose key exists in this registry, so any new
// platform feature must be registered here to become sellable.
export interface FeatureDefinition {
  key: string;
  name: string;
  description?: string;
  group?: string;
  displayOrder?: number;
  isActive: boolean;
  isBuiltIn?: boolean;
}
