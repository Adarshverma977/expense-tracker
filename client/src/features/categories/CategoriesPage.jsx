
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  FolderOpen,
  Plus,
  RefreshCw,
  Search,
  Tag,
} from "lucide-react";

import CategoryCard from "./components/CategoryCard";
import CategoryModal from "./components/CategoryModal";
import DeleteCategoryModal from "./components/DeleteCategoryModal";

import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../../services/categoryService";

import "./CategoriesPage.css";

function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [pageError, setPageError] = useState("");
  const [notice, setNotice] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [initialType, setInitialType] = useState("expense");
  const [deletingCategory, setDeletingCategory] = useState(null);

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    setPageError("");

    try {
      const response = await getCategories();
      const result = response?.data?.categories;

      if (!Array.isArray(result)) {
        throw new Error("Unexpected categories response from server.");
      }

      setCategories(result);
    } catch (error) {
      setPageError(
        error?.response?.data?.message ||
        error?.message ||
        "Unable to load categories."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    if (!notice) return undefined;

    const timeout = window.setTimeout(() => setNotice(""), 3000);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const incomeCategories = useMemo(
    () => categories.filter((category) => category.type === "income"),
    [categories]
  );

  const expenseCategories = useMemo(
    () => categories.filter((category) => category.type === "expense"),
    [categories]
  );

  const filteredCategories = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return categories.filter((category) => {
      const matchesType =
        activeTab === "all" || category.type === activeTab;

      const matchesSearch =
        !normalizedSearch ||
        category.name.toLowerCase().includes(normalizedSearch);

      return matchesType && matchesSearch;
    });
  }, [categories, activeTab, search]);

  const openCreateModal = (type = "expense") => {
    setEditingCategory(null);
    setInitialType(type);
    setIsModalOpen(true);
  };

  const openEditModal = (category) => {
    setEditingCategory(category);
    setInitialType(category.type);
    setIsModalOpen(true);
  };

  const closeModal = useCallback(() => {
    if (isSubmitting) return;
    setIsModalOpen(false);
    setEditingCategory(null);
  }, [isSubmitting]);

  const handleSaveCategory = async (payload) => {
    setIsSubmitting(true);

    try {
      if (editingCategory) {
        await updateCategory(editingCategory._id, payload);
        setNotice("Category updated successfully.");
      } else {
        await createCategory(payload);
        setNotice("Category created successfully.");
      }

      setIsModalOpen(false);
      setEditingCategory(null);
      await fetchCategories();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!deletingCategory) return;

    setIsDeleting(true);

    try {
      await deleteCategory(deletingCategory._id);

      setDeletingCategory(null);
      setNotice("Category deactivated successfully.");
      await fetchCategories();
    } catch (error) {
      setPageError(
        error?.response?.data?.message ||
        "Unable to delete category."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <main className="categories-page">
      <header className="categories-page-header">
        <div>
          <span className="categories-eyebrow">
            ORGANIZE YOUR FINANCES
          </span>
          <h1>Categories</h1>
          <p>
            Personalize how you organize and track your money.
          </p>
        </div>

        <button
          type="button"
          className="category-primary-button categories-add-button"
          onClick={() => openCreateModal("expense")}
        >
          <Plus size={18} />
          Add category
        </button>
      </header>

      {notice && (
        <div className="category-notice" role="status">
          {notice}
        </div>
      )}

      <section className="categories-overview">
        <article className="category-overview-card">
          <span className="category-overview-icon all">
            <FolderOpen size={20} />
          </span>
          <div>
            <span>Total active categories</span>
            <strong>{categories.length}</strong>
          </div>
        </article>

        <article className="category-overview-card">
          <span className="category-overview-icon income">
            <ArrowDownLeft size={20} />
          </span>
          <div>
            <span>Income categories</span>
            <strong>{incomeCategories.length}</strong>
          </div>
        </article>

        <article className="category-overview-card">
          <span className="category-overview-icon expense">
            <ArrowUpRight size={20} />
          </span>
          <div>
            <span>Expense categories</span>
            <strong>{expenseCategories.length}</strong>
          </div>
        </article>

        <article className="category-overview-card">
          <span className="category-overview-icon custom">
            <Tag size={20} />
          </span>
          <div>
            <span>Custom categories</span>
            <strong>
              {categories.filter((category) => !category.isDefault).length}
            </strong>
          </div>
        </article>
      </section>

      <section className="categories-toolbar">
        <div className="category-tabs" role="tablist">
          {[
            { value: "all", label: "All categories" },
            { value: "income", label: "Income" },
            { value: "expense", label: "Expenses" },
          ].map((tab) => (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.value}
              className={activeTab === tab.value ? "active" : ""}
              onClick={() => setActiveTab(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <label className="category-search">
          <Search size={17} />
          <input
            type="search"
            placeholder="Search categories..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>

        <button
          type="button"
          className="category-refresh-button"
          onClick={fetchCategories}
          disabled={isLoading}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </section>

      {pageError ? (
        <div className="category-page-error">
          <p>{pageError}</p>
          <button
            type="button"
            className="category-secondary-button"
            onClick={fetchCategories}
          >
            Try again
          </button>
        </div>
      ) : isLoading ? (
        <div className="category-loading-state">
          <span className="category-loading-spinner" />
          <p>Loading categories...</p>
        </div>
      ) : (
        <section className="categories-content">
          {filteredCategories.length ? (
            <>
              {(activeTab === "all" || activeTab === "income") && (
                <section className="category-group">
                  <div className="category-group-header">
                    <div>
                      <span className="category-group-indicator income" />
                      <h2>Income categories</h2>
                      <span className="category-group-count">
                        {filteredCategories.filter(
                          (category) => category.type === "income"
                        ).length}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="category-add-inline"
                      onClick={() => openCreateModal("income")}
                    >
                      <Plus size={15} />
                      Add income
                    </button>
                  </div>

                  <div className="category-grid">
                    {filteredCategories
                      .filter((category) => category.type === "income")
                      .map((category) => (
                        <CategoryCard
                          key={category._id}
                          category={category}
                          onEdit={openEditModal}
                          onDelete={setDeletingCategory}
                        />
                      ))}
                  </div>
                </section>
              )}

              {(activeTab === "all" || activeTab === "expense") && (
                <section className="category-group">
                  <div className="category-group-header">
                    <div>
                      <span className="category-group-indicator expense" />
                      <h2>Expense categories</h2>
                      <span className="category-group-count">
                        {filteredCategories.filter(
                          (category) => category.type === "expense"
                        ).length}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="category-add-inline"
                      onClick={() => openCreateModal("expense")}
                    >
                      <Plus size={15} />
                      Add expense
                    </button>
                  </div>

                  <div className="category-grid">
                    {filteredCategories
                      .filter((category) => category.type === "expense")
                      .map((category) => (
                        <CategoryCard
                          key={category._id}
                          category={category}
                          onEdit={openEditModal}
                          onDelete={setDeletingCategory}
                        />
                      ))}
                  </div>
                </section>
              )}
            </>
          ) : (
            <div className="category-empty-state">
              <div className="category-empty-icon">
                <Tag size={27} />
              </div>
              <h3>No categories found</h3>
              <p>
                {search
                  ? "Try another search term."
                  : "Create a category to organize your transactions."}
              </p>
              {!search && (
                <button
                  type="button"
                  className="category-primary-button"
                  onClick={() => openCreateModal(
                    activeTab === "income" ? "income" : "expense"
                  )}
                >
                  <Plus size={17} />
                  Create category
                </button>
              )}
            </div>
          )}
        </section>
      )}

      <CategoryModal
        isOpen={isModalOpen}
        category={editingCategory}
        initialType={initialType}
        onClose={closeModal}
        onSubmit={handleSaveCategory}
        isSubmitting={isSubmitting}
      />

      <DeleteCategoryModal
        category={deletingCategory}
        onClose={() => {
          if (!isDeleting) setDeletingCategory(null);
        }}
        onConfirm={handleDeleteCategory}
        isDeleting={isDeleting}
      />
    </main>
  );
}

export default CategoriesPage;
