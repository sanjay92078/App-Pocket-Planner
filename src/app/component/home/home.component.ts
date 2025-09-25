import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { Color, ScaleType } from '@swimlane/ngx-charts';

interface Transaction {
  id: number;
  amount: number;
  type: 'Income' | 'Expense';
  category: string;
  date: string;
  description?: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgxChartsModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {
  transactionForm: FormGroup;
  transactions: Transaction[] = [];
  filteredTransactions: Transaction[] = [];

  incomeCategories = ['Salary', 'Misc'];
  expenseCategories = ['Food', 'Transport', 'Bills', 'Rent', 'Misc'];

  get categories() {
    return this.transactionForm.get('type')?.value === 'Income'
      ? this.incomeCategories
      : this.expenseCategories;
  }

  // NEW: dynamic unique categories from transactions
  uniqueCategories: string[] = [];

  totalIncome = 0;
  totalExpenses = 0;
  currentBalance = 0;
  avgIncome = 0;
  avgExpense = 0;

  filterType: string = '';
  filterCategory: string = '';
  filterStartDate: string = '';
  filterEndDate: string = '';

  sortField: 'date' | 'amount' = 'date';
  sortDirection: 'asc' | 'desc' = 'desc';

  pieChartData: { name: string; value: number }[] = [];

  colorScheme: Color = {
    name: 'categoryScheme',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: [
      '#4CAF50',   // Green
      '#FF9800',   // Orange
      '#2196F3',   // Blue
      '#E91E63',   // Pink
      '#9C27B0',   // Purple
      '#F44336',   // Red
      '#00BCD4',   // Cyan
      '#FFEB3B'    // Yellow
    ]
  };

  constructor(private fb: FormBuilder, private router: Router) {
    this.transactionForm = this.fb.group({
      amount: ['', [Validators.required, Validators.min(0.01)]],
      type: ['Income', Validators.required],
      category: ['', Validators.required],
      date: [this.getTodayDate(), Validators.required],
      description: [''],
    });

    this.transactionForm.get('type')?.valueChanges.subscribe(() => {
      this.transactionForm.get('category')?.setValue('');
    });
  }

  ngOnInit(): void {
    this.loadTransactions();
    this.updateDashboard();
    this.filterTransactions();
  }

  getTodayDate(): string {
    return new Date().toISOString().substring(0, 10);
  }

  private getCurrentUserId(): string | null {
    return localStorage.getItem('userId');
  }

  updateUniqueCategories(): void {
    const categoriesSet = new Set<string>();
    this.transactions.forEach(tx => categoriesSet.add(tx.category));
    this.uniqueCategories = Array.from(categoriesSet).sort();
  }

  loadTransactions(): void {
    const userId = this.getCurrentUserId();
    if (userId) {
      const data = localStorage.getItem(`transactions_${userId}`);
      this.transactions = data ? JSON.parse(data) : [];
    } else {
      this.transactions = [];
    }
    this.updateUniqueCategories();
  }

  saveTransactions(): void {
    const userId = this.getCurrentUserId();
    if (userId) {
      localStorage.setItem(`transactions_${userId}`, JSON.stringify(this.transactions));
    }
    this.updateUniqueCategories();
  }

  addTransaction(): void {
    if (this.transactionForm.invalid) return;

    const transaction: Transaction = {
      id: Date.now(),
      ...this.transactionForm.value,
    };

    this.transactions.push(transaction);
    this.saveTransactions();

    this.transactionForm.reset({
      amount: '',
      type: 'Income',
      category: '',
      date: this.getTodayDate(),
      description: '',
    });

    this.updateDashboard();
    this.filterTransactions();
  }

  editTransaction(tx: Transaction): void {
    this.transactionForm.setValue({
      amount: tx.amount,
      type: tx.type,
      category: tx.category,
      date: tx.date,
      description: tx.description || '',
    });
    this.deleteTransaction(tx);
  }

  deleteTransaction(tx: Transaction): void {
    this.transactions = this.transactions.filter((t) => t.id !== tx.id);
    this.saveTransactions();
    this.updateDashboard();
    this.filterTransactions();
  }

  filterTransactions(): void {
    this.filteredTransactions = this.transactions.filter((tx) => {
      const matchesType = this.filterType ? tx.type === this.filterType : true;
      const matchesCategory = this.filterCategory ? tx.category === this.filterCategory : true;

      const txDate = new Date(tx.date).getTime();
      const afterStart = this.filterStartDate ? txDate >= new Date(this.filterStartDate).getTime() : true;
      const beforeEnd = this.filterEndDate ? txDate <= new Date(this.filterEndDate).getTime() : true;

      return matchesType && matchesCategory && afterStart && beforeEnd;
    });

    this.sortTransactions();
  }

  sortTransactions(): void {
    this.filteredTransactions.sort((a, b) => {
      let comparison = 0;
      if (this.sortField === 'date') {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (this.sortField === 'amount') {
        comparison = a.amount - b.amount;
      }
      return this.sortDirection === 'asc' ? comparison : -comparison;
    });
  }

  updateDashboard(): void {
    this.totalIncome = this.transactions
      .filter((tx) => tx.type === 'Income')
      .reduce((sum, tx) => sum + tx.amount, 0);

    this.totalExpenses = this.transactions
      .filter((tx) => tx.type === 'Expense')
      .reduce((sum, tx) => sum + tx.amount, 0);

    this.currentBalance = this.totalIncome - this.totalExpenses;

    const monthlyIncome: { [key: string]: number } = {};
    const monthlyExpense: { [key: string]: number } = {};

    this.transactions.forEach((tx) => {
      const month = tx.date.substring(0, 7);
      if (tx.type === 'Income') {
        monthlyIncome[month] = (monthlyIncome[month] || 0) + tx.amount;
      } else if (tx.type === 'Expense') {
        monthlyExpense[month] = (monthlyExpense[month] || 0) + tx.amount;
      }
    });

    const incomeMonths = Object.keys(monthlyIncome).length || 1;
    const expenseMonths = Object.keys(monthlyExpense).length || 1;

    this.avgIncome = this.totalIncome / incomeMonths;
    this.avgExpense = this.totalExpenses / expenseMonths;

    this.prepareChartData();
  }

  prepareChartData(): void {
    const categoryTotals: { [key: string]: number } = {};
    [...this.incomeCategories, ...this.expenseCategories].forEach((cat) => {
      categoryTotals[cat] = 0;
    });

    this.transactions.forEach((tx) => {
      if (categoryTotals.hasOwnProperty(tx.category)) {
        categoryTotals[tx.category] += tx.amount;
      }
    });

    this.pieChartData = Object.keys(categoryTotals).map((cat) => ({
      name: cat,
      value: categoryTotals[cat] || 0,
    }));
  }

  getname(): string | null {
    const userJson = localStorage.getItem('currentUser');
    if (userJson) {
      const user = JSON.parse(userJson);
      return user.name || null;
    }
    return null;
  }

  logout(): void {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userId');
    this.router.navigate(['/login']);
  }
}
