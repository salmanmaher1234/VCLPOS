<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EmployeeShift;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ShiftController extends Controller
{
    public function index(Request $request)
    {
        $shifts = EmployeeShift::where('user_id', $request->user()->id)->get();
        return response()->json($shifts);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'start_time' => 'required',
            'end_time' => 'required',
            'late_threshold' => 'required|integer|min:0',
            'weekly_off' => 'nullable|array'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $shift = EmployeeShift::create([
            'user_id' => $request->user()->id,
            'name' => $request->name,
            'start_time' => $request->start_time,
            'end_time' => $request->end_time,
            'late_threshold' => $request->late_threshold,
            'weekly_off' => $request->weekly_off
        ]);

        return response()->json($shift, 201);
    }

    public function update(Request $request, $id)
    {
        $shift = EmployeeShift::where('user_id', $request->user()->id)->findOrFail($id);
        $shift->update($request->all());
        return response()->json($shift);
    }

    public function destroy(Request $request, $id)
    {
        $shift = EmployeeShift::where('user_id', $request->user()->id)->findOrFail($id);
        $shift->delete();
        return response()->json(['message' => 'Shift deleted successfully']);
    }
}
