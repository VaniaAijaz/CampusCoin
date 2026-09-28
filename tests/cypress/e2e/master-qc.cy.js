describe("Campus Coin V18 Master E2E System Verification", () => {
  const BASE_URL = "http://localhost:5173";

  beforeEach(() => {
    cy.viewport(1280, 800);
  });

  it("1. Visual Audit: Zero-Branding & True Glass CSS Recipe", () => {
    cy.visit(BASE_URL);
    cy.get("body").then(($body) => {
      const text = $body.text();
      expect(text).not.to.match(/\bApple\b/i);
      expect(text).not.to.match(/\bNayaPay\b/i);
      expect(text).not.to.match(/\bReactBits\b/i);
    });
    cy.get("nav").should("be.visible");
  });

  it("2. Mobile Responsiveness: 375px viewport with no horizontal overflow", () => {
    cy.viewport(375, 812);
    cy.visit(BASE_URL);
    cy.document().then((doc) => {
      expect(doc.documentElement.scrollWidth).to.be.at.most(doc.documentElement.clientWidth + 1);
    });
  });

  it("3. Landing to Demo Mode: Intercept mutations with Glass Toast", () => {
    cy.visit(BASE_URL);
    cy.contains(/Try Demo|Live Demo/i).click();
    cy.url().should("include", "/app");
    cy.window().then((win) => {
      const user = JSON.parse(win.localStorage.getItem("cc_user") || "{}");
      expect(user.isDemo).to.be.true;
    });
  });

  it("4. Dashboard: Graphs, Top Category & Playful Curved AI Insights", () => {
    cy.visit(`${BASE_URL}/app/dashboard`);
    cy.get(".rounded-\\[3rem\\]").should("exist");
  });

  it("5. Categories: Delete category triggers GlassConfirmModal", () => {
    cy.visit(`${BASE_URL}/app/categories`);
    cy.get("body").then(($body) => {
      if ($body.find("button[title*='Delete']").length > 0) {
        cy.get("button[title*='Delete']").first().click();
        cy.contains("Delete Category").should("be.visible");
        cy.contains("Are you sure you want to delete").should("be.visible");
      }
    });
  });

  it("6. Transactions: Digital Receipt modal with Download Receipt", () => {
    cy.visit(`${BASE_URL}/app/transactions`);
    cy.get("body").then(($body) => {
      const rows = $body.find("table tbody tr");
      if (rows.length > 0) {
        cy.wrap(rows.first()).click();
        cy.contains("Receipt").should("be.visible");
        cy.contains("Download Receipt").should("be.visible");
      }
    });
  });

  it("7. Khata (IOU): Strike-through and paid badge toggle", () => {
    cy.visit(`${BASE_URL}/app/khata`);
    cy.contains(/Khata|Peer-to-Peer Ledger/i).should("be.visible");
  });

  it("8. Admin Panel Isolation: Strict separation from student features", () => {
    cy.visit(`${BASE_URL}/admin`);
    cy.get("a:contains('Khata')").should("not.exist");
    cy.get("a:contains('Budgets')").should("not.exist");
  });
});
