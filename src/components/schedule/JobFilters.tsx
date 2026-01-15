import { Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { JOB_TYPES } from '@/types/job';

interface JobFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  dateFilter: string;
  onDateFilterChange: (value: string) => void;
  jobTypeFilter: string;
  onJobTypeFilterChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
}

export function JobFilters({
  searchQuery,
  onSearchChange,
  dateFilter,
  onDateFilterChange,
  jobTypeFilter,
  onJobTypeFilterChange,
  sortBy,
  onSortChange,
}: JobFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search jobs..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      <Select value={dateFilter} onValueChange={onDateFilterChange}>
        <SelectTrigger className="w-full sm:w-[140px]">
          <SelectValue placeholder="Filter by date" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Jobs</SelectItem>
          <SelectItem value="today">Today</SelectItem>
          <SelectItem value="upcoming">Upcoming</SelectItem>
          <SelectItem value="overdue">Overdue</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
        </SelectContent>
      </Select>

      <Select value={jobTypeFilter} onValueChange={onJobTypeFilterChange}>
        <SelectTrigger className="w-full sm:w-[150px]">
          <SelectValue placeholder="Job type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          {JOB_TYPES.map((type) => (
            <SelectItem key={type.value} value={type.value}>
              {type.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={sortBy} onValueChange={onSortChange}>
        <SelectTrigger className="w-full sm:w-[140px]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="date-asc">Date (Earliest)</SelectItem>
          <SelectItem value="date-desc">Date (Latest)</SelectItem>
          <SelectItem value="status">Status</SelectItem>
          <SelectItem value="type">Job Type</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
