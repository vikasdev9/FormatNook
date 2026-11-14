# JSON Folding & Collapsing Detailed Test Results

| Subsystem | Folding Feature | Status | Verification Details |
|---|---|---|---|
| Folding | Individual Collapse | **PASS** | Collapsed node displays summary: { ... 2 props } |
| Folding | Individual Expand | **PASS** | Clicking fold pill expands node back to full view |
| Folding | Expand All / Collapse All | **PASS** | Toolbar Expand All and Collapse All operational |
| Folding | Depth-based Folding | **PASS** | Level 1 folding collapses top-level objects |
| Folding | Original Line Numbers | **PASS** | Original line numbering preserved during folding |
| Folding | Monaco Folding Controller | **PASS** | Monaco folding actions dispatched via adapter |
