# Quick Token Reference

## Common Mappings

| Use Case | SLDS Token | Value | Semantic Alias |
|----------|-----------|-------|----------------|
| **Small gap** | `--slds-g-spacing-2` | 8px | `--token-spacing-sm` |
| **Medium gap** | `--slds-g-spacing-3` | 12px | `--token-spacing-md` |
| **Large gap** | `--slds-g-spacing-4` | 16px | `--token-spacing-lg` |
| **Button height** | `--slds-g-sizing-10` | 48px | - |
| **Icon size** | `--slds-g-sizing-7` | 24px | - |
| **Card corner** | `--slds-g-radius-border-3` | 12px | - |
| **Light surface** | `--slds-g-color-surface-container-3` | #e5e5e5 | `--token-layer-hover` |
| **White surface** | `--slds-g-color-surface-container-1` | #ffffff | `--token-layer-surface` |
| **Subtle border** | `--slds-g-color-border-1` | #c9c9c9 | `--token-border-subtle` |
| **Primary text** | `--slds-g-color-on-surface-2` | #2e2e2e | `--token-text-primary` |
| **Secondary text** | `--slds-g-color-on-surface-1` | #5c5c5c | `--token-text-secondary` |
| **Brand blue** | `--slds-g-color-accent-2` | #0250d9 | `--token-interactive` |

## Copy-Paste Snippets

### Card Component
```scss
.card {
  padding: var(--slds-g-spacing-4);
  border-radius: var(--slds-g-radius-border-3);
  background: var(--slds-g-color-surface-container-1);
  border: 1px solid var(--slds-g-color-border-1);
}
```

### Button
```scss
.button {
  height: var(--slds-g-sizing-10);
  padding: 0 var(--slds-g-spacing-4);
  border-radius: var(--slds-g-radius-border-2);
  background: var(--slds-g-color-accent-2);
  color: var(--slds-g-color-on-surface-inverse-1);
  
  &:hover {
    background: var(--slds-g-color-accent-3);
  }
}
```

### Input Field
```scss
.input {
  height: var(--slds-g-sizing-10);
  padding: 0 var(--slds-g-spacing-3);
  border-radius: var(--slds-g-radius-border-2);
  border: 1px solid var(--slds-g-color-border-1);
  background: var(--slds-g-color-surface-container-1);
  
  &:focus {
    border-color: var(--slds-g-color-accent-2);
  }
}
```

### Section Header
```scss
.section-header {
  padding: var(--slds-g-spacing-3) var(--slds-g-spacing-4);
  background: var(--slds-g-color-surface-container-2);
  border-bottom: 1px solid var(--slds-g-color-border-1);
  color: var(--slds-g-color-on-surface-2);
}
```
