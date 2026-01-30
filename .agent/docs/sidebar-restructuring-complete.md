# Sidebar Restructuring: Life OS Master Filter

## ✅ Changes Implemented

### **1. Redesigned DomainSwitcher for Sidebar**

**Layout**: Changed from horizontal pill buttons to a **2x2 grid** layout optimized for sidebar width.

**Visual Design**:
- **Icons**: Lucide React icons (Briefcase, Coffee, BookOpen, TrendingUp)
- **Active State**: High-contrast background with domain-specific color
  - Work: Blue (`rgba(59, 130, 246, 0.15)`)
  - Life: Green (`rgba(16, 185, 129, 0.15)`)
  - Study: Orange (`rgba(245, 158, 11, 0.15)`)
  - Invest: Purple (`rgba(139, 92, 246, 0.15)`)
- **Inactive State**: Muted gray ghost buttons
- **"All Domains" Toggle**: Full-width button below the grid

**Structure**:
```
┌─────────┬─────────┐
│  Work   │  Life   │
│ 💼 WORK │ ☕ LIFE │
├─────────┼─────────┤
│  Study  │ Invest  │
│ 📚 STUDY│ 📈 INVEST│
└─────────┴─────────┘
┌───────────────────┐
│   All Domains     │
└───────────────────┘
```

---

### **2. Sidebar Hierarchy Restructured**

**Before**:
```
[ Calendar Layers ]
[ Domain Switcher ]
[ My Schedules ]
[ Category Checkboxes ]
```

**After**:
```
[ Domain Switcher (Master Filter) ]
[ {Dynamic Title} ]
[ Filtered Category Checkboxes ]
```

**Removed**: "Calendar Layers" header (redundant)  
**Repositioned**: DomainSwitcher moved to top of sidebar  
**Enhanced**: Section title now changes based on active domain

---

### **3. Domain-Aware Filtering ("Drill-Down" Effect)**

#### **Dynamic Section Titles**
The filter section title changes based on the selected domain:

| Active Domain | Section Title |
|---------------|---------------|
| All | "All Categories" |
| Work | "Work Projects" |
| Life | "Life Categories" |
| Study | "Study Topics" |
| Invest | "Portfolios" |

#### **Category Filtering Logic**
Categories are filtered based on the active domain:

```typescript
const domainCategoryMap = {
  work: ['work'],
  life: ['personal', 'health'],
  study: ['study'],
  invest: ['general']
}
```

**Example Behavior**:
- Select "Work" → Only shows "Work" category checkbox
- Select "Life" → Shows "Personal" and "Health" checkboxes
- Select "Study" → Only shows "Study" category checkbox
- Select "All" → Shows all 5 categories

---

### **4. Implementation Details**

#### **New Helper Functions**

**`getFilterLabel()`**: Returns domain-specific title
```typescript
const getFilterLabel = () => {
  switch (activeDomain) {
    case 'work': return 'Work Projects'
    case 'life': return 'Life Categories'
    case 'study': return 'Study Topics'
    case 'invest': return 'Portfolios'
    default: return 'All Categories'
  }
}
```

**`getVisibleCategories()`**: Filters categories by domain
```typescript
const getVisibleCategories = () => {
  if (activeDomain === 'all') return CATEGORIES
  
  const domainCategoryMap = {
    work: ['work'],
    life: ['personal', 'health'],
    study: ['study'],
    invest: ['general']
  }
  
  const allowedCategories = domainCategoryMap[activeDomain] || []
  return CATEGORIES.filter(cat => allowedCategories.includes(cat.value))
}
```

---

### **5. User Experience Flow**

**Scenario**: User wants to focus on Work tasks

1. **Click "Work" in Domain Switcher**
   - Work button highlights with blue background
   - Other domains become muted gray

2. **Sidebar Updates**
   - Section title changes to "Work Projects"
   - Only "Work" category checkbox is visible
   - Personal/Health/Study/General categories are hidden

3. **Calendar Updates** (TODO)
   - Calendar view filters to show only Work domain items
   - Events/tasks tagged with "work" domain are displayed

---

### **6. Visual Comparison**

#### **Before (Horizontal Pills)**
```
[🌐 All] [💼 Work] [🏠 Life] [📚 Study] [💰 Invest]
```
- Took up horizontal space
- Emoji-based (unprofessional)
- No visual hierarchy

#### **After (2x2 Grid)**
```
┌──────────┬──────────┐
│ Briefcase│  Coffee  │
│   WORK   │   LIFE   │
├──────────┼──────────┤
│ BookOpen │TrendingUp│
│  STUDY   │  INVEST  │
└──────────┴──────────┘
```
- Compact sidebar-optimized layout
- Professional Lucide icons
- Clear visual hierarchy
- Active state with domain color

---

### **7. File Changes**

| File | Changes | Lines Modified |
|------|---------|----------------|
| `DomainSwitcher.tsx` | Redesigned as 2x2 grid with icons | 1-160 |
| `PlanView.tsx` | Moved switcher to top, added filtering logic | 62-315 |

---

### **8. Future Enhancements**

**Expand Domain-Category Mapping**:
```typescript
const domainCategoryMap = {
  work: ['work', 'meetings', 'projects'],
  life: ['personal', 'health', 'family', 'hobbies'],
  study: ['study', 'courses', 'research'],
  invest: ['stocks', 'crypto', 'real-estate', 'retirement']
}
```

**Add Empty State**:
When a domain has no categories:
```tsx
{getVisibleCategories().length === 0 && (
  <div style={{ color: '#737373', fontSize: '0.75rem' }}>
    No filters for this domain
  </div>
)}
```

**Persist Selection**:
```typescript
useEffect(() => {
  localStorage.setItem('activeDomain', activeDomain)
}, [activeDomain])
```

---

## **Testing Checklist**

- [ ] Click each domain button (Work, Life, Study, Invest, All)
- [ ] Verify active state highlighting with correct color
- [ ] Confirm section title changes dynamically
- [ ] Check that category list filters correctly
- [ ] Test hover states on inactive domains
- [ ] Verify "All Domains" button shows all categories

---

**Status**: ✅ **Sidebar Restructured with Master Filter**

The Life OS DomainSwitcher now acts as the primary navigation control in the sidebar, with intelligent drill-down filtering that adapts the category list based on the selected domain.
