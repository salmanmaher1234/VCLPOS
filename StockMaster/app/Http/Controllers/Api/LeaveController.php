<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EmployeeLeave;
use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class LeaveController extends Controller
{
    public function index(Request $request)
    {
        $leaves = EmployeeLeave::whereHas('employee', function($q) use ($request) {
            $q->where('user_id', $request->user()->id);
        })->with('employee')->latest()->get();
        
        return response()->json($leaves);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'employee_id' => 'required|exists:employees,id',
            'type' => 'required|in:sick,casual,paid,unpaid',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'reason' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $leave = EmployeeLeave::create([
            'employee_id' => $request->employee_id,
            'type' => $request->type,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'reason' => $request->reason,
            'status' => 'pending'
        ]);

        return response()->json($leave, 201);
    }

    public function updateStatus(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|in:approved,rejected'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $leave = EmployeeLeave::whereHas('employee', function($q) use ($request) {
            $q->where('user_id', $request->user()->id);
        })->findOrFail($id);

        $leave->update([
            'status' => $request->status,
            'approved_by' => $request->user()->id
        ]);

        // If approved, sync employee status and attendance
        if ($request->status === 'approved') {
            $employee = $leave->employee;
            $today = now()->toDateString();
            
            // 1. Update status if currently on leave
            if ($today >= $leave->start_date && $today <= $leave->end_date) {
                $employee->update(['status' => 'on_leave']);
            }

            // 2. Create/Update attendance records for the leave period
            $start = \Carbon\Carbon::parse($leave->start_date);
            $end = \Carbon\Carbon::parse($leave->end_date);
            
            while ($start->lte($end)) {
                \App\Models\EmployeeAttendance::updateOrCreate(
                    ['employee_id' => $employee->id, 'date' => $start->toDateString()],
                    ['status' => 'on_leave', 'time_in' => null, 'time_out' => null]
                );
                $start->addDay();
            }
        }

        return response()->json($leave);
    }
}
